const Stepper = {
  _queues: {},
  _debugLevel: 0,

  /**
   *  Generates unique hash
   *  @method _getUUID
   *  @return {String}  string contain the new hash generated with 36 chars
   */
  _getUUID () {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
      .replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0
        const v = c === 'x'
          ? r
          : (r & 0x3 | 0x8)

        return v.toString(16)
      })
  },

  /**
   *  Check how much queues was created
   *  @method _queueChecker
   *  @return {Number}  quantity of queues that was created
   */
  _queueChecker () {
    const queues = Object.keys(this._queues).length

    this._log(4, 'log', `Number of created queues: ${queues}`)

    return queues
  },

  /**
   *  Process the next item on selected queue
   *  @method _nextItem
   *  @param  {Number}  [queue] used to identify the queue and get the next item
   *                            to be processed
   *  @return {Function}  [_timer] function to calc the expiration time
   *                               and move ahead
   */
  _nextItem (queue = undefined) {
    if (queue.constructor !== Number ||
        queue === undefined ||
        queue === null) {
      return
    }

    if (!this._queueChecker()) {
      this._log(5, 'error', `You not have queues created yet!`)
      return
    }

    if (!this._queues[queue]) {
      this._log(5, 'error', `The queue ${queue} do not exist!`)
      return
    }

    const queueInfo = `${this._queues[queue].name}`

    if (!this._queues[queue].items.length) {
      this._log(5, 'warn', `The queue '${queueInfo}' doesn’t have items to be processed`)
      this._timer(queue)
      return
    }

    this._log(2, 'log', `Working on '${queueInfo}' in ${this._queues[queue].items.length} items`)

    const {
      args,
      scope,
      callback,
      persist
    } = this._queues[queue].items[0]

    if (!persist) {
      this._queues[queue].items.shift()
    }

    if (!callback ||
        callback.constructor !== Function) {
      this._log(3, 'warn', `This item doesn’t have a callback to execute on queue '${queueInfo}'`)

      return this._timer(queue)
    }

    try {
      this._log(3, 'log', `Invoking callback on queue '${queueInfo}'`)
      callback.apply(scope, args)
    } catch (_) {
      this._log(3, 'error', `Error invoking callback on queue '${queueInfo}'`)
    }

    return this._timer(queue)
  },

  /**
   *  Recursive function to calc the expiration time using the low level
   *  process time
   *  @method _timer
   *  @param  {Number}  [queue] used to identify the queue and calc the
   *                            expiration time
   *  @return {Function}  [_timer] recursively until the expiration time
   *                                was reached
   *  @return {Function}  [_nextItem] when the expiration time was reached
   */
  _timer (queue = undefined) {
    if (queue.constructor !== Number ||
        queue === undefined ||
        queue === null) {
      return
    }

    if (!this._queues[queue].initialStep) {
      this._queues[queue].initialStep = process.hrtime()
    }

    if (this._queues[queue].stepSize === 0) {
      this._queues[queue].stepSize = 1
    }

    const hrTime = process.hrtime(this._queues[queue].initialStep)
    const timeout = Math.floor(hrTime[0] * 1000 + hrTime[1] / 1000000)

    if (timeout <= this._queues[queue].stepSize) {
      return setTimeout(
        () => this._timer(queue),
        0
      )
    }

    this._queues[queue].initialStep = null
    return this._nextItem(queue)
  },

  /**
   *  Simple function to control the log send to console matching
   *  with the _debugLevel
   *  @method _log
   *  @param  {Number}  [level] used to match with the _debugLevel
   *  @param  {String}  [type] used to invoking console function
   *                           ['log', 'warn', 'error', 'fatal']
   *  @param  {String}  [message] the message will be printed on console
   *  @param  {Object}  [object] if user want print an object
   *                             (note: this object will be convert on
   *                             flat string)
   *  @return {Function}  [console[type]] the native console function
   */
  _log (level = 0, type = 'log', message = '', object = {}) {
    const types = ['log', 'warn', 'error', 'fatal']

    if (!types.includes(type) ||
        type.constructor !== String ||
        message === undefined ||
        message.constructor !== String) {
      return
    }

    if (!Object.keys(object).length) {
      object = ''
    } else {
      object = ` ${JSON.stringify(object)}`
    }

    if (level > this._debugLevel) {
      return
    }

    return console[type](`[Stepper] ${message}${object}`)
  },

  /**
   *  Create queue
   *  @method create
   *  @param  {Number}  [queue] it's like an ID used to identify the queue
   *                            in others functions
   *  @param  {String}  [name] it's a symbolic name to identify queue on console,
   *                           if user not provide an name, an unique UUID
   *                           will be used
   *  @param  {Number}  [stepSize] the duration of each step to process the
   *                               item on this queue in millisecons
   *  @return {Object}  [this] return the context to user continue invoking
   *                           functions
   */
  create ({
    queue = undefined,
    name = undefined,
    stepSize = 1
  }) {
    if (queue.constructor !== Number ||
        name.constructor !== String ||
        queue === undefined ||
        queue === null) {
      return
    }

    if (this._queues[queue]) {
      return
    }

    if (!name) {
      name = this._getUUID()
    }

    this._log(3, 'log', `Creating queue: ${name}`)

    this._queues[queue] = {
      queue,
      name,
      stepSize,
      initialStep: null,
      items: []
    }

    return this
  },

  /**
   *  Destroy queue
   *  @method destroy
   *  @param  {Number}  [queue] used to identify the queue and remove it
   *  @return {Object}  [this] return the context to user continue invoking
   *                           functions
   */
  destroy ({
    queue = undefined
  }) {
    if (queue === undefined ||
        queue.constructor !== Number ||
        !this._queues[queue]) {
      return
    }

    this._log(3, 'log', `Destroying queue: ${this._queues[queue].name}`)

    this._queues = Object
      .entries(this._queues)
      .filter(([key, value]) => {
        if (value.queue !== queue) {
          return true
        }

        return false
      })

    return this
  },

  /**
   *  Get step size of an queue
   *  @method getStep
   *  @param  {Number}  [queue] used to identify the queue and get the step size
   *  @return {Number}  the step size in millisecons
   */
  getStep ({
    queue = undefined
  }) {
    if (queue === undefined ||
        queue.constructor !== Number ||
        queue === null) {
      return
    }

    this._log(4, 'log', `Getting step size of queue: ${this._queues[queue].name}`)

    return this._queues[queue].stepSize
  },

  /**
   *  Change step size of an queue
   *  @method changeStep
   *  @param  {Number}  [queue] used to identify the queue and set new step size
   *  @param  {Number}  [stepSize] the step size in millisecons
   *  @return {Object}  [this] return the context to user continue invoking
   *                           functions
   */
  changeStep ({
    queue = undefined,
    stepSize = 1
  }) {
    if (queue === undefined ||
        queue === null ||
        queue.constructor !== Number ||
        stepSize === null ||
        stepSize.constructor !== Number ||
        stepSize === undefined) {
      return
    }

    this._log(4, 'log', `Changing step size of queue: ${this._queues[queue].name}`)

    this._queues[queue].stepSize = stepSize

    this._nextItem(queue)

    return this
  },

  /**
   *  Adding item on queue and invoke the next item
   *  @method push
   *  @param  {Number}  [queue] used to identify the queue to add item
   *  @param  {Function}  [callback] function that will be invoked on timeout
   *  @param  {Boolean} [persist] if true the item will not removed of items
   *  @param  {Object}  [scope] scope of the callback function if it's necessary
   *  @param  {Array}   [args] arguments of the callback function
   *  @return {Object}  [this] return the context to user continue invoking
   *                           functions
   */
  push ({
    queue = null,
    callback = undefined,
    persist = false,
    scope = null,
    args = []
  }) {
    if (queue === null ||
        queue === undefined ||
        queue.constructor !== Number ||
        callback.constructor !== Function ||
        persist.constructor !== Boolean ||
        args.constructor !== Array ||
        !callback ||
        !this._queues[queue]) {
      return
    }

    this._log(2, 'log', `Adding job on queue '${this._queues[queue].name}'`)

    this._queues[queue]
      .items
      .push({
        args,
        persist,
        scope,
        callback
      })

    this._timer(queue)

    return this
  },

  /**
   *  An simple function to set the debug level and control the printed logs
   *  @method debug
   *  @param  {Number} [level] the debug level, can be 1, 2, 3, 4 or 5
   *  @return {Object}  [this] return the context to user continue invoking
   *                           functions
   */
  debug ({
    level = 0
  }) {
    if (level === undefined ||
        level.constructor !== Number) {
      return
    }

    this._debugLevel = level

    this._log(level, 'log', `Level of debugging is set to: ${level}`)

    return this
  }
}

module.exports = Stepper
