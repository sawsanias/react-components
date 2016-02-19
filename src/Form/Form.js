import React from 'react';
import cx from 'classnames';
import { props, pure, skinnable, t } from '../utils';
import flattenDeep from 'lodash/array/flattenDeep';
import pairs from 'lodash/object/pairs';
import isArray from 'lodash/lang/isArray';
import Input from './Fields/Input';

import './form.scss';

const getInputChildren = (child) => {
  if (child.type === 'input' && child.props.type !== 'submit') {
    return child;
  } else if (child.props && child.props.children) {
    if (isArray(child.props.children)) {
      return child.props.children.map(getInputChildren).filter(c => c);
    }
    return getInputChildren(child.props.children);
  }
};

@skinnable()
@pure
@props({
  className: t.maybe(t.String),
  type: t.maybe(t.Object),
  children: t.ReactChildren,
  onSubmit: t.Function
})
export default class Form extends React.Component {
  constructor(props) {
    super(props);
    const inputs = flattenDeep(props.children.map(getInputChildren).filter(c => c));
    this.state = inputs.reduce((acc, input) => {
      const key = input.props.name;
      acc.values = {
        ...acc.values,
        [key]: input.props.value || null
      };
      acc.errors = {
        ...acc.errors,
        [key]: null
      };
      return acc;
    }, { values: {}, errors: {} });
  }

  validate = () => {
    const keysValuesPairs = pairs(this.state.values);
    return keysValuesPairs.reduce((acc, pair) => {
      console.log(pair[0], pair[1], this.checkInput(pair[0], pair[1]));
      return acc && this.isInputValid(pair[0], pair[1]);
    }, true);
  }

  getInputType = (key) => {
    const { type } = this.props;
    if (type) {
      const { [key]: input } = type;
      if (input) {
        if (t.Object.is(input)) {
          return input.type;
        }
      }
      return input;
    }
    return null;
  }

  isInputValid = (key, value) => {
    const input = this.getInput(key);
    if (input && input.is(value)) {
      return true;
    }
    return false;
  }

  checkInput = (key, value) => {
    const isInputValid = this.isInputValid(key, value);
    if (isInputValid) {
      const inputType = this.getInputType(key);
      if (inputType) {
        if (inputType.message) {
          return inputType.message;
        }
        return inputType.getValidationMessage();
      }
    }
    return null;
  };

  linkState = (key) => {
    return {
      value: this.state.values[key],
      requestChange: (value) => {
        this.setState({
          values: {
            ...this.state.values,
            [key]: value
          },
          errors: {
            ...this.state.errors,
            [key]: this.checkInput(key, value)
          }
        }, () => {
          // TODO: find a less hacky way to accomplish this

          const inputChild = React.findDOMNode(this.refs[key]).firstChild.firstChild;
          if (inputChild) {
            inputChild.focus();
            inputChild.value = value;
          }
        });
      }
    };
  }

  onSubmit = (e) => {
    e.preventDefault();
    const isValid = this.validate();
    if (isValid) {
      this.props.onSubmit(e, this.state.values);
    }
  }

  getLocals() {
    const {
      props: {
        className,
        children
      },
      onSubmit
    } = this;

    return {
      formProps: {
        className: cx('form', className),
        onSubmit
      },
      children
    };
  }

  templateChild = (child) => {
    if (child.type === 'input') {
      if (child.props.type === 'submit') {
        return (
          <Input {...child.props} />
        );
      }
      const inputName = child.props.name;
      const errorMessage = this.state.errors[inputName];
      const error = {
        show: !!errorMessage,
        position: 'bottom',
        message: errorMessage
      };
      return (
        <Input {...child.props}
          ref={inputName}
          error={error}
          valueLink={this.linkState(inputName)}
        />
      );
    } else if (child.props && child.props.children) {
      if (isArray(child.props.children)) {
        return React.cloneElement(child, child.props, child.props.children.map(this.templateChild));
      }
      return React.cloneElement(child, child.props, this.templateChild(child.props.children));
    }
    return child;
  }

  template({ formProps, children }) {
    return (
      <form {...formProps}>
        {children.map(this.templateChild)}
      </form>
    );
  }
}
