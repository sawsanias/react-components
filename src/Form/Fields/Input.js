import React from 'react';
import cx from 'classnames';
import { props, pure, skinnable, t } from '../../utils';
import FlexView from '../../flex/FlexView';
import Popover from '../../popover/Popover';

import './input.scss';

const InputErrorType = t.struct({
  show: t.Boolean,
  position: t.maybe(t.enums.of(['top', 'right', 'bottom', 'left'])),
  message: t.maybe(t.String)
}, 'InputError');
@skinnable()
@pure
@props({
  type: t.maybe(t.enums.of(['text', 'password', 'radio', 'checkbox'])),
  name: t.String,
  placeholder: t.maybe(t.String),
  error: InputErrorType,
  valueLink: t.maybe(t.struct({
    value: t.Any,
    requestChange: t.Function
  }))
}, { strict: false })
export default class Input extends React.Component {

  static defaultProps = {
    type: 'text',
    error: {
      show: false,
      message: null,
      position: 'bottom'
    }
  }

  constructor(props) {
    super(props);
    this.state = {
      focused: false
    };
  }

  getLocals() {
    const {
      props: {
        error,
        ...props
      },
      state: {
        focused
      }
    } = this;
    const popoverProps = {
      popover: {
        position: error.position,
        content: error.message,
        isOpen: error.show && focused
      }
    };

    return {
      shouldRenderError: error.show,
      popoverProps,
      errorMessage: error.message,
      ...props
    };
  }


  onFocus = () => {
    this.setState({ focused: true });
  }

  onBlur = () => {
    this.setState({ focused: false });
  };

  templateInput = (inputProps) => {
    const {
      className,
      type,
      name,
      placeholder,
      valueLink,
      errorMessage
    } = inputProps;

    return (
      <input
        className={cx(className, { error: !!errorMessage })}
        type={type}
        name={name}
        placeholder={placeholder}
        valueLink={valueLink}
        onFocus={this.onFocus}
        onBlur={this.onBlur}
      />
    );
  }

  template({ shouldRenderError, popoverProps, ...inputProps }) {
    const inputTemplate = this.templateInput(inputProps);
    return (
      <FlexView className='input'>
        {shouldRenderError ? (
          <Popover { ...popoverProps }>
            {inputTemplate}
          </Popover>
        ) : inputTemplate}
      </FlexView>
    );
  }
}
