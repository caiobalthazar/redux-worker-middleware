'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var plainSender = function plainSender(worker, action, next) {
  if (action.meta && action.meta.WebWorker) {
    worker.postMessage(action);
  }
  return next(action);
};

var stringSender = function stringSender(worker, action, next) {
  if (action.meta && action.meta.WebWorker) {
    worker.postMessage(JSON.stringify(action));
  }
  return next(action);
};

var plainReceiver = function plainReceiver(dispatch) {
  return function (_ref) {
    var resultAction = _ref.data;

    dispatch(resultAction);
  };
};

var stringReceiver = function stringReceiver(dispatch) {
  return function (_ref2) {
    var string = _ref2.data;

    dispatch(JSON.parse(string));
  };
};

var createWorkerMiddleware = function createWorkerMiddleware(worker) {
  var _ref3 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      _ref3$sendString = _ref3.sendString,
      sendString = _ref3$sendString === undefined ? false : _ref3$sendString,
      _ref3$receiveString = _ref3.receiveString,
      receiveString = _ref3$receiveString === undefined ? false : _ref3$receiveString;

  /*
    for now, we don't really care if you actually pass it a Worker instance; as long as
    it look likes a Worker and works like a Worker (has a `postMessage` method), it _is_ a Worker.
     The reason behind is that we want to support WebWorker shims in an easy manner,
    although shimming it doesn't make a lot of sense.
  */

  if (!worker) {
    throw new Error('`createWorkerMiddleware` expects a worker instance as the argument. Instead received: ' + worker);
  } else if (!worker.postMessage) {
    throw new Error('The worker instance is expected to have a `postMessage` method.');
  }

  var sender = sendString ? stringSender : plainSender;

  return function (_ref4) {
    var dispatch = _ref4.dispatch;

    /*
      when the worker posts a message back, dispatch the action with its payload
      so that it will go through the entire middleware chain
    */
    // eslint-disable-next-line no-param-reassign
    worker.onmessage = receiveString ? stringReceiver(dispatch) : plainReceiver(dispatch);

    return function (next) {
      if (!next) {
        throw new Error('Worker middleware received no `next` action. Check your chain of middlewares.');
      }

      return function (action) {
        return sender(worker, action, next);
      };
    };
  };
};

exports.default = createWorkerMiddleware;