import Vue from 'vue'

import QIcon from '../icon/QIcon.js'
import QSpinner from '../spinner/QSpinner.js'

import ValidateMixin from '../../mixins/validate.js'
import slot from '../../utils/slot.js'
import { stop, prevent } from '../../utils/event.js'
import uid from '../../utils/uid.js'

export default Vue.extend({
  name: 'QField',

  inheritAttrs: false,

  mixins: [ ValidateMixin ],

  props: {
    label: String,
    stackLabel: Boolean,
    hint: String,
    hideHint: Boolean,
    prefix: String,
    suffix: String,

    color: String,
    bgColor: String,
    dark: Boolean,

    filled: Boolean,
    outlined: Boolean,
    borderless: Boolean,
    standout: [Boolean, String],

    square: Boolean,

    loading: Boolean,

    bottomSlots: Boolean,
    hideBottomSpace: Boolean,

    rounded: Boolean,
    dense: Boolean,
    itemAligned: Boolean,

    counter: Boolean,

    clearable: Boolean,
    clearIcon: String,

    disable: Boolean,
    readonly: Boolean,

    autofocus: Boolean,

    maxlength: [Number, String],
    maxValues: [Number, String] // private, do not add to JSON; internally needed by QSelect
  },

  data () {
    return {
      focused: false,

      // used internally by validation for QInput
      // or menu handling for QSelect
      innerLoading: false,
      targetUid: this.$attrs.for === void 0 ? 'qf_' + uid() : this.$attrs.for
    }
  },

  computed: {
    editable () {
      return this.disable !== true && this.readonly !== true
    },

    hasValue () {
      const value = this.__getControl === void 0 ? this.value : this.innerValue

      return value !== void 0 &&
        value !== null &&
        ('' + value).length > 0
    },

    computedCounter () {
      if (this.counter !== false) {
        const len = typeof this.value === 'string' || typeof this.value === 'number'
          ? ('' + this.value).length
          : (Array.isArray(this.value) === true ? this.value.length : 0)
        const max = this.maxlength !== void 0 ? this.maxlength : this.maxValues

        return len + (max !== void 0 ? ' / ' + max : '')
      }
    },

    floatingLabel () {
      return this.hasError === true ||
        this.stackLabel === true ||
        this.focused === true ||
        (
          this.inputValue !== void 0 && this.hideSelected === true
            ? this.inputValue.length > 0
            : this.hasValue === true
        ) ||
        (
          this.displayValue !== void 0 &&
          this.displayValue !== null &&
          ('' + this.displayValue).length > 0
        )
    },

    shouldRenderBottom () {
      return this.bottomSlots === true ||
        this.hint !== void 0 ||
        this.rules !== void 0 ||
        this.counter === true ||
        this.error !== null
    },

    classes () {
      return {
        [this.fieldClass]: this.fieldClass !== void 0,

        [`q-field--${this.styleType}`]: true,
        'q-field--rounded': this.rounded,
        'q-field--square': this.square,

        'q-field--focused': this.focused === true || this.hasError === true,
        'q-field--float': this.floatingLabel,
        'q-field--labeled': this.label !== void 0,

        'q-field--dense': this.dense,
        'q-field--item-aligned q-item-type': this.itemAligned,
        'q-field--dark': this.dark,

        'q-field--auto-height': this.__getControl === void 0,

        'q-field--with-bottom': this.hideBottomSpace !== true && this.shouldRenderBottom === true,
        'q-field--error': this.hasError,

        'q-field--readonly': this.readonly === true && this.disable !== true,
        'q-field--disabled': this.disable
      }
    },

    styleType () {
      if (this.filled === true) { return 'filled' }
      if (this.outlined === true) { return 'outlined' }
      if (this.borderless === true) { return 'borderless' }
      if (this.standout) { return 'standout' }
      return 'standard'
    },

    contentClass () {
      const cls = []

      if (this.hasError === true) {
        cls.push('text-negative')
      }
      else if (typeof this.standout === 'string' && this.standout.length > 0 && this.focused === true) {
        return this.standout
      }
      else if (this.color !== void 0) {
        cls.push('text-' + this.color)
      }

      if (this.bgColor !== void 0) {
        cls.push(`bg-${this.bgColor}`)
      }

      return cls
    },

    controlSlotScope () {
      return {
        id: this.targetUid,
        field: this.$el,
        editable: this.editable,
        focused: this.focused,
        floatingLabel: this.floatingLabel,
        value: this.value,
        emitValue: this.__emitValue
      }
    }
  },

  methods: {
    focus () {
      if (this.showPopup !== void 0 && this.hasDialog === true) {
        this.showPopup()
        return
      }

      this.__focus()
    },

    blur () {
      const el = document.activeElement
      // IE can have null document.activeElement
      if (el !== null && this.$el.contains(el)) {
        el.blur()
      }
    },

    __focus () {
      const el = document.activeElement
      let target = this.$refs.target
      // IE can have null document.activeElement
      if (target !== void 0 && (el === null || el.id !== this.targetUid)) {
        target.matches('[tabindex]') || (target = target.querySelector('[tabindex]'))
        target !== null && target !== el && target.focus()
      }
    },

    __getContent (h) {
      const node = []

      this.$scopedSlots.prepend !== void 0 && node.push(
        h('div', {
          staticClass: 'q-field__prepend q-field__marginal row no-wrap items-center',
          key: 'prepend'
        }, this.$scopedSlots.prepend())
      )

      node.push(
        h('div', {
          staticClass: 'q-field__control-container col relative-position row no-wrap q-anchor--skip'
        }, this.__getControlContainer(h))
      )

      this.$scopedSlots.append !== void 0 && node.push(
        h('div', {
          staticClass: 'q-field__append q-field__marginal row no-wrap items-center',
          key: 'append'
        }, this.$scopedSlots.append())
      )

      this.hasError === true && this.noErrorIcon === false && node.push(
        this.__getInnerAppendNode(h, 'error', [
          h(QIcon, { props: { name: this.$q.iconSet.field.error, color: 'negative' } })
        ])
      )

      if (this.loading === true || this.innerLoading === true) {
        node.push(
          this.__getInnerAppendNode(
            h,
            'inner-loading-append',
            this.$scopedSlots.loading !== void 0
              ? this.$scopedSlots.loading()
              : [ h(QSpinner, { props: { color: this.color } }) ]
          )
        )
      }
      else if (this.clearable === true && this.hasValue === true && this.editable === true) {
        node.push(
          this.__getInnerAppendNode(h, 'inner-clearable-append', [
            h(QIcon, {
              staticClass: 'cursor-pointer',
              props: { name: this.clearIcon || this.$q.iconSet.field.clear },
              on: {
                click: this.__clearValue
              }
            })
          ])
        )
      }

      this.__getInnerAppend !== void 0 && node.push(
        this.__getInnerAppendNode(h, 'inner-append', this.__getInnerAppend(h))
      )

      this.__getPopup !== void 0 && node.push(
        this.__getPopup(h)
      )

      return node
    },

    __getControlContainer (h) {
      const node = []

      this.prefix !== void 0 && this.prefix !== null && node.push(
        h('div', {
          staticClass: 'q-field__prefix no-pointer-events row items-center'
        }, [ this.prefix ])
      )

      if (this.__getControl !== void 0) {
        node.push(
          this.__getControl(h)
        )
      }
      // internal usage only:
      else if (this.$scopedSlots.rawControl !== void 0) {
        node.push(this.$scopedSlots.rawControl())
      }
      else if (this.$scopedSlots.control !== void 0) {
        node.push(
          h('div', {
            ref: 'target',
            staticClass: 'q-field__native row',
            attrs: {
              ...this.$attrs,
              autofocus: this.autofocus
            }
          }, this.$scopedSlots.control(this.controlSlotScope))
        )
      }

      this.label !== void 0 && node.push(
        h('div', {
          staticClass: 'q-field__label no-pointer-events absolute ellipsis'
        }, [ this.label ])
      )

      this.suffix !== void 0 && this.suffix !== null && node.push(
        h('div', {
          staticClass: 'q-field__suffix no-pointer-events row items-center'
        }, [ this.suffix ])
      )

      return node.concat(
        this.__getDefaultSlot !== void 0
          ? this.__getDefaultSlot(h)
          : slot(this, 'default')
      )
    },

    __getBottom (h) {
      let msg, key

      if (this.hasError === true) {
        if (this.computedErrorMessage !== void 0) {
          msg = [ h('div', [ this.computedErrorMessage ]) ]
          key = this.computedErrorMessage
        }
        else {
          msg = slot(this, 'error')
          key = 'q--slot-error'
        }
      }
      else if (this.hideHint !== true || this.focused === true) {
        if (this.hint !== void 0) {
          msg = [ h('div', [ this.hint ]) ]
          key = this.hint
        }
        else {
          msg = slot(this, 'hint')
          key = 'q--slot-hint'
        }
      }

      const hasCounter = this.counter === true || this.$scopedSlots.counter !== void 0

      if (this.hideBottomSpace === true && hasCounter === false && msg === void 0) {
        return
      }

      const main = h('div', {
        key,
        staticClass: 'q-field__messages col'
      }, msg)

      return h('div', {
        staticClass: 'q-field__bottom row items-start q-field__bottom--' +
          (this.hideBottomSpace !== true ? 'animated' : 'stale')
      }, [
        this.hideBottomSpace === true
          ? main
          : h('transition', { props: { name: 'q-transition--field-message' } }, [
            main
          ]),

        hasCounter === true
          ? h('div', {
            staticClass: 'q-field__counter'
          }, this.$scopedSlots.counter !== void 0 ? this.$scopedSlots.counter() : [ this.computedCounter ])
          : null
      ])
    },

    __getInnerAppendNode (h, key, content) {
      return content === null ? null : h('div', {
        staticClass: 'q-field__append q-field__marginal row no-wrap items-center q-anchor--skip',
        key
      }, content)
    },

    __onControlPopupShow (e) {
      e !== void 0 && stop(e)
      this.$emit('popup-show', e)
      this.hasPopupOpen = true
      this.__onControlFocusin(e)
    },

    __onControlPopupHide (e) {
      e !== void 0 && stop(e)
      this.$emit('popup-hide', e)
      this.hasPopupOpen = false
      this.__onControlFocusout(e)
    },

    __onControlFocusin (e) {
      if (this.editable === true && this.focused === false) {
        this.focused = true
        this.$emit('focus', e)
      }
    },

    __onControlFocusout (e, then) {
      clearTimeout(this.focusoutTimer)
      this.focusoutTimer = setTimeout(() => {
        if (
          document.hasFocus() === true && (
            this.hasPopupOpen === true ||
            this.$refs === void 0 ||
            this.$refs.control === void 0 ||
            this.$refs.control.contains(document.activeElement) !== false
          )
        ) {
          return
        }

        if (this.focused === true) {
          this.focused = false
          this.$emit('blur', e)
        }

        then !== void 0 && then()
      })
    },

    __clearValue (e) {
      stop(e)
      if (this.type === 'file') {
        // do not let focus be triggered
        // as it will make the native file dialog
        // appear for another selection
        prevent(e)
        this.$refs.input.value = null
      }
      this.$emit('input', null)
      this.$emit('clear', this.value)
    },

    __emitValue (value) {
      this.$emit('input', value)
    }
  },

  render (h) {
    this.__onPreRender !== void 0 && this.__onPreRender()
    this.__onPostRender !== void 0 && this.$nextTick(this.__onPostRender)

    return h('label', {
      staticClass: 'q-field row no-wrap items-start',
      class: this.classes,
      attrs: {
        for: this.targetUid
      }
    }, [
      this.$scopedSlots.before !== void 0 ? h('div', {
        staticClass: 'q-field__before q-field__marginal row no-wrap items-center'
      }, this.$scopedSlots.before()) : null,

      h('div', {
        staticClass: 'q-field__inner relative-position col self-stretch column justify-center'
      }, [
        h('div', {
          ref: 'control',
          staticClass: 'q-field__control relative-position row no-wrap',
          class: this.contentClass,
          attrs: { tabindex: -1 },
          on: this.controlEvents
        }, this.__getContent(h)),

        this.shouldRenderBottom === true
          ? this.__getBottom(h)
          : null
      ]),

      this.$scopedSlots.after !== void 0 ? h('div', {
        staticClass: 'q-field__after q-field__marginal row no-wrap items-center'
      }, this.$scopedSlots.after()) : null
    ])
  },

  created () {
    this.__onPreRender !== void 0 && this.__onPreRender()

    this.controlEvents = this.__getControlEvents !== void 0
      ? this.__getControlEvents()
      : {
        focus: this.focus,
        focusin: this.__onControlFocusin,
        focusout: this.__onControlFocusout,
        'popup-show': this.__onControlPopupShow,
        'popup-hide': this.__onControlPopupHide
      }
  },

  mounted () {
    this.autofocus === true && this.$el.focus()
  },

  beforeDestroy () {
    clearTimeout(this.focusoutTimer)
  }
})
