const getUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
    .replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0
      const v = c === 'x'
        ? r
        : (r & 0x3 | 0x8)

      return v.toString(16)
    })
}

const Stepper = {
  _stepID: 0,
  _stepSize: 100,
  _queues: {},
  _actualQueue: 0,
  stepSize (size) {
    if (size.constructor !== Number) {
      return this
    }

    this._stepSize = size

    return this
  },
  _queueChecker () {
    return Object.keys(this._queues).length
  },
  _queueRouter () {
    if (this._queues[this._actualQueue + 1]) {
      this._actualQueue += 1
    } else {
      this._actualQueue = 0
    }
  },
  _nextItem () {
    if (!this._queueChecker()) {
      return
    }

    if (!this._queues[this._actualQueue].items.length) {
      this._timer()
      return
    }

    const {
      callback,
      args,
      scope
    } = this._queues[this._actualQueue].items.shift()

    if (!callback) {
      this._timer()
      return
    }

    try {
      callback.apply(scope, args)
    } catch (err) {
      console.log(err)
    }

    this._timer()
    return
  },
  _timer () {
    return setTimeout(
      () => {
        this._stepID += 1
        this._queueRouter()
        return this._nextItem()
      },
      this._stepSize
    )
  },
  register ({
    queue = undefined,
    name = undefined
  }) {
    if (queue === undefined ||
        queue === null) {
      return
    }

    if (!name) {
      name = getUUID()
    }

    this._queues[queue] = {
      queue,
      name,
      items: []
    }

    return this
  },
  push ({
    queue = null,
    callback = undefined,
    scope = null,
    args = []
  }) {
    if (!callback ||
        !args.length ||
        !this._queues[queue]) {
      return
    }

    this._queues[queue]
      .items
      .push({
        args,
        scope,
        callback
      })

    return this
  },
  start () {
    return this._nextItem()
  }
}

module.exports = Stepper
