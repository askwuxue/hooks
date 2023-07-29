import { act, renderHook, waitFor } from '@testing-library/react';
import useRequest from '../index';
import { request } from '../../utils/testingHelpers';

// 这种方式复写了原始的error方法，为了不被代码中的error输出影响。如果不复写，会在测试中看到error的输出
const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('useRequest', () => {
  beforeAll(() => {
    // mock timer
    jest.useFakeTimers();
  });

  afterAll(() => {
    // 还原对error mock的处理
    errorSpy.mockRestore();
  });

  // 执行hook，将hook的返回值赋值给hook变量
  const setUp = (service, options) => renderHook((o) => useRequest(service, o || options));
  let hook;
  it('useRequest should auto run', async () => {
    let value, success;
    const successCallback = (text) => {
      success = text;
    };
    // mock 一个错误回调，为什么只有错误回调时通过jest mock的呢
    const errorCallback = jest.fn();
    const beforeCallback = () => {
      value = 'before';
    };
    const finallyCallback = () => {
      value = 'finally';
    };
    //运行一个函数，即使是异步函数
    act(() => {
      hook = setUp(request, {
        onSuccess: successCallback,
        onError: errorCallback,
        onBefore: beforeCallback,
        onFinally: finallyCallback,
      });
    });
    expect(hook.result.current.loading).toBe(true);
    expect(value).toBe('before');
    expect(success).toBeUndefined();

    // 执行所有的timer 函数，不只是setTimeout，应该含有其他的定时器。这里就是setTimeout 1000ms
    act(() => {
      jest.runAllTimers();
    });
    await waitFor(() => expect(hook.result.current.loading).toBe(false));
    expect(success).toBe('success');
    expect(hook.result.current.data).toBe('success');
    expect(value).toBe('finally');
    expect(errorCallback).toHaveBeenCalledTimes(0);

    //manual run fail
    act(() => {
      // 手动执行失败
      hook.result.current.run(0);
    });
    expect(hook.result.current.loading).toBe(true);

    act(() => {
      jest.runAllTimers();
    });
    await waitFor(() => expect(hook.result.current.error).toEqual(new Error('fail')));
    expect(hook.result.current.loading).toBe(false);
    expect(errorCallback).toHaveBeenCalledTimes(1);

    //manual run success
    act(() => {
      hook.result.current.run(1);
    });
    expect(hook.result.current.loading).toBe(true);

    act(() => {
      jest.runAllTimers();
    });
    expect(hook.result.current.data).toBe('success');
    await waitFor(() => expect(hook.result.current.loading).toBe(false));
    expect(errorCallback).toHaveBeenCalledTimes(1);
    // 解绑hook
    hook.unmount();

    //auto run fail
    act(() => {
      hook = setUp(() => request(0), {
        onSuccess: successCallback,
        onError: errorCallback,
      });
    });
    expect(hook.result.current.loading).toBe(true);

    act(() => {
      jest.runAllTimers();
    });
    await waitFor(() => expect(hook.result.current.error).toEqual(new Error('fail')));
    expect(hook.result.current.loading).toBe(false);
    expect(errorCallback).toHaveBeenCalledTimes(2);
    hook.unmount();
  });

  it('useRequest should be manually triggered', async () => {
    act(() => {
      hook = setUp(request, {
        manual: true,
      });
    });
    expect(hook.result.current.loading).toBe(false);
    act(() => {
      hook.result.current.run(1);
    });
    expect(hook.result.current.loading).toBe(true);

    act(() => {
      jest.runAllTimers();
    });
    await waitFor(() => expect(hook.result.current.loading).toBe(false));
    expect(hook.result.current.data).toBe('success');
    act(() => {
      hook.result.current.run(0);
    });
    expect(hook.result.current.loading).toBe(true);

    act(() => {
      jest.runAllTimers();
    });
    await waitFor(() => expect(hook.result.current.loading).toBe(false));
    expect(hook.result.current.error).toEqual(new Error('fail'));
    hook.unmount();
  });

  it('useRequest runAsync should work', async () => {
    let success = '',
      error = '';

    act(() => {
      hook = setUp(request, {
        manual: true,
      });
    });
    act(() => {
      hook.result.current
        .runAsync(0)
        .then((res) => {
          success = res;
        })
        .catch((err) => {
          error = err;
        });
    });

    act(() => {
      jest.runAllTimers();
    });
    expect(success).toBe('');
    await waitFor(() => expect(error).toEqual(new Error('fail')));
    success = '';
    error = '';
    act(() => {
      hook.result.current
        .runAsync(1)
        .then((res) => {
          success = res;
        })
        .catch((err) => {
          error = err;
        });
    });

    act(() => {
      jest.runAllTimers();
    });
    await waitFor(() => expect(success).toBe('success'));
    expect(error).toBe('');
    hook.unmount();
  });

  it('useRequest mutate should work', async () => {
    act(() => {
      hook = setUp(request, {});
    });

    act(() => {
      jest.runAllTimers();
    });
    await waitFor(() => expect(hook.result.current.data).toBe('success'));
    act(() => {
      hook.result.current.mutate('hello');
    });
    expect(hook.result.current.data).toBe('hello');
    hook.unmount();
  });

  it('useRequest defaultParams should work', async () => {
    act(() => {
      hook = setUp(request, {
        defaultParams: [1, 2, 3],
      });
    });
    expect(hook.result.current.loading).toBe(true);

    act(() => {
      jest.runAllTimers();
    });
    expect(hook.result.current.params).toEqual([1, 2, 3]);
    await waitFor(() => expect(hook.result.current.data).toBe('success'));
    expect(hook.result.current.loading).toBe(false);
    hook.unmount();
  });
});
