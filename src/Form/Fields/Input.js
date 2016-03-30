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
  type: t.maybe(t.enums.of(['text', 'email', 'password', 'radio', 'checkbox'])),
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

  getLocals() {
    const {
      props: {
        error,
        ...props
      }
    } = this;
    const popoverProps = {
      popover: {
        position: error.position,
        content: <div>{error.message}</div>,
        isOpen: error.show
      }
    };

    return {
      popoverProps,
      errorMessage: error.message,
      ...props
    };
  }

  templateInput = (inputProps) => {
    const {
      className,
      type,
      name,
      placeholder,
      valueLink,
      defaultChecked,
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
        defaultChecked={defaultChecked}
      />
    );
  }

  template({ popoverProps, ...inputProps }) {
    const inputTemplate = this.templateInput(inputProps);
    return (
      <FlexView className={cx('input', inputProps.type)} vAlignContent='center' grow>
        <Popover { ...popoverProps }>
          {inputTemplate}
        </Popover>
      </FlexView>
    );
  }
}
