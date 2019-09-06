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
  _queues: {},
  _verbose: true,
  _hrstart: null,
  _queueChecker () {
    return Object.keys(this._queues).length
  },
  _nextItem (queue) {
    if (!this._queueChecker()) {
      return
    }

    if (!this._queues[queue]) {
      return
    }

    const queueInfo = `${queue} | ${this._queues[queue].name}`

    if (!this._queues[queue].items.length) {
      // if (this._verbose) {
      //   console.log(`[Stepper] Nothing to do on queue: ${queueInfo}`)
      // }
      this._timer(queue)
      return
    }

    if (this._verbose) {
      console.log(`[Stepper] Working on: ${queueInfo} in ${this._queues[queue].items.length} items`)
    }

    const {
      args,
      persist,
      scope,
      callback
    } = this._queues[queue].items.shift()

    if (persist) {
      this.push({
        queue,
        callback,
        persist,
        scope,
        args
      })
    }

    if (!callback ||
        callback.constructor !== Function) {
      if (this._verbose) {
        console.log(`[Stepper] This item not have a callback to execute on queue: ${queueInfo}`)
      }

      return this._timer(queue)
    }

    try {
      callback.apply(scope, args)
    } catch (_) {
      if (this._verbose) {
        console.error(`[Stepper] Error invoking callback on queue: ${queueInfo}`)
      }
    }

    return this._timer(queue)
  },
  _timer (queue) {
    if (!this._queues[queue].initialStep) {
      // this._hrstart = process.hrtime()
      this._queues[queue].initialStep = new Date()
    }

    if (this._queues[queue].stepSize === 0) {
      this._queues[queue].stepSize = 100
    }

    const instant = new Date()
    const timeout = Math.abs(this._queues[queue].initialStep - instant)

    if (timeout <= this._queues[queue].stepSize) {
      return setTimeout(
        () => this._timer(queue),
        0
      )
    }

    // const diff = process.hrtime(this._hrstart)

    this._hrstart = null
    this._queues[queue].initialStep = null
    return this._nextItem(queue)

    // this._queues[queue].timer = setTimeout(
    //   () => this._nextItem(queue),
    //   time
    // )
  },
  check () {
    return this._queues
  },
  create ({
    queue = undefined,
    name = undefined,
    stepSize = 100
  }) {
    if (queue.constructor !== Number ||
        name.constructor !== String ||
        queue === undefined ||
        queue === null) {
      return
    }

    if (this._queues[queue] ||
        this._queues[name]) {
      return
    }

    if (!name) {
      name = getUUID()
    }

    if (this._verbose) {
      console.log(`[Stepper] Creating queue: ${name}`)
    }

    this._queues[queue] = {
      queue,
      name,
      stepSize,
      initialStep: null,
      items: []
    }

    return this
  },
  destroy ({
    name = undefined
  }) {
    if (!name ||
        !this._queues[name]) {
      return
    }

    this._queues = Object
      .entries(this._queues)
      .filter(([key, value]) => {
        if (value.name !== name) {
          return true
        }

        return false
      })

    return this
  },
  getStep ({
    queue = undefined
  }) {
    if (queue === undefined ||
        queue === null) {
      return
    }

    return this._queues[queue].stepSize
  },
  changeStep ({
    queue = undefined,
    stepSize = 100
  }) {
    if (queue === undefined ||
        queue === null ||
        stepSize === null ||
        stepSize === undefined) {
      return
    }

    this._queues[queue].stepSize = stepSize

    // clearTimeout(this._queues[queue].timer)
    this._nextItem(queue)
    // this._timer(queue)

    return this
  },
  push ({
    queue = null,
    callback = undefined,
    persist = false,
    scope = null,
    args = []
  }) {
    if (queue === null ||
        queue === undefined ||
        !callback ||
        !this._queues[queue]) {
      return
    }

    // if (this._verbose) {
    //   console.log(`[Stepper] Adding job on queue: ${queue} | ${this._queues[queue].name}`)
    // }

    this._queues[queue]
      .items
      .push({
        args,
        persist,
        scope,
        callback
      })

    // if (this._queues[queue].stepType === 'elastic' &&
    //     this._queues[queue].stepQueueReference !== null &&
    //     this._queues[queue].stepQueueReference !== undefined &&
    //     this._queues[queue].stepQueueReference.constructor === Number) {
    //   console.log(this._queues[this._queues[queue].stepQueueReference].items)
    //   const items = this._queues[this._queues[queue].stepQueueReference].items.length || 2
    //   const minimumTime = this._queues[this._queues[queue].stepQueueReference].stepSize
    //   this._queues[queue].stepSize = Math.floor((minimumTime / items))
    //   // console.log(`[Stepper] Step size set to: ${this._queues[queue].stepSize} on queue: ${queue} | ${this._queues[queue].name}`)
    //   clearTimeout(this._queues[queue].timer)
    //   this._timer(queue)
    // }

    return this
  },
  start () {
    Object
      .keys(this._queues)
      .forEach(
        queue =>
          this._nextItem(queue)
      )

    return this
  }
}

module.exports = Stepper
