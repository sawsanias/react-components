import React from 'react';
import cx from 'classnames';
import { props, pure, skinnable, t } from '../utils';
import values from 'lodash/values';
import flattenDeep from 'lodash/flattenDeep';
import toPairs from 'lodash/toPairs';
import isArray from 'lodash/isArray';
import Input from './Fields/Input';

import './form.scss';

const InputType = t.struct({
  type: t.Function,
  match: t.maybe(t.struct({
    key: t.String,
    message: t.String
  }, 'InputMatch'))
}, 'InputType');

const FormTypeValue = t.union([t.Function, InputType]);
FormTypeValue.dispatch = (x) => t.Function.is(x) ? t.Function : InputType;
const FormType = t.dict(t.String, FormTypeValue);


const DEFAULT_ERROR_MESSAGE = 'Input is invalid.';

const getInputChildren = (child) => {
  if (child.type === 'input' && child.props.type !== 'submit') {
    return child;
  } else if (child.props && child.props.children) {
    if (isArray(child.props.children)) {
      return child.props.children.map(getInputChildren).filter(c => c);
    }
    return getInputChildren(child.props.children).filter(c => c);
  }
};

@skinnable()
@pure
@props({
  className: t.maybe(t.String),
  type: t.maybe(FormType),
  children: t.ReactChildren,
  onChange: t.maybe(t.Function),
  onSubmit: t.Function
})
export default class Form extends React.Component {

  static defaultProps = {
    onChange: () => {}
  };

  constructor(props) {
    super(props);
    console.log(this.getInputs());
    this.state = this.getInputs().reduce((acc, input) => {
      const key = input.props.name;
      acc.values = {
        ...acc.values,
        [key]: input.props.defaultValue || null
      };
      acc.errors = {
        ...acc.errors,
        [key]: null
      };
      return acc;
    }, { values: {}, errors: {} });
  }

  getInputs = () => {
    const { children } = this.props;
    const _children = isArray(children) ? children : [children];
    return flattenDeep(_children.map(getInputChildren).filter(c => c));
  }

  getErrors = () => {
    return toPairs(this.state.values).reduce((acc, [key, value]) => {
      acc[key] = this.checkInput(key, value);
      return acc;
    }, {});
  }

  getInputValue = (key) => {
    return this.state.values[key];
  }

  getInput = (key) => {
    const { type } = this.props;
    if (type) {
      const { [key]: input } = type;
      if (input) {
        if (!t.Object.is(input)) {
          return { type: input };
        }
      }
      return input;
    }
    return null;
  }

  checkInput = (key, value) => {
    const { match, type } = this.getInput(key);
    if (type) {
      if (!type.is(value)) {
        if (type.getValidationErrorMessage) {
          return type.getValidationErrorMessage();
        }
        return DEFAULT_ERROR_MESSAGE;
      }
    }
    if (match) {
      const matchingInputValue = this.getInputValue(match.key);
      if (!!value && !!matchingInputValue) {
        if (value !== matchingInputValue) {
          return match.message;
        }
      }
    }
    return null;
  };

  linkState = (key) => {
    return {
      value: this.state.values[key],
      requestChange: (value) => {
        const inputError = this.checkInput(key, value);
        this.setState({
          values: {
            ...this.state.values,
            [key]: value
          },
          errors: {
            ...this.state.errors,
            [key]: inputError
          }
        }, () => {
          const hasErrors = values(this.getErrors()).filter(e => !!e).length === 0;
          this.props.onChange(key, value, !inputError, hasErrors);
        });
      }
    };
  }

  onSubmit = (e) => {
    e.preventDefault();
    const errors = this.getErrors();
    this.setState({
      values: this.state.values,
      errors
    }, () => {
      const errorsValues = values(errors).filter(e => !!e);
      if (errorsValues.length === 0) {
        this.props.onSubmit(this.state.values);
      }
    });
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

  templateChild = (child, key = 0) => {
    const props = { ...child.props, key };
    if (child && child.type === 'input') {
      if (child.props.type === 'submit') {
        return (
          <input {...props} />
        );
      }

      const inputName = props.name;
      const errorMessage = this.state.errors[inputName];
      const error = {
        show: !!errorMessage,
        position: 'bottom',
        message: errorMessage
      };

      return (
        <Input {...props}
          ref={inputName}
          error={error}
          valueLink={this.linkState(inputName)}
        />
      );
    } else if (props && props.children) {
      if (isArray(props.children)) {
        return React.cloneElement(child, props, props.children.map(this.templateChild));
      }
      return React.cloneElement(child, props, this.templateChild(props.children));
    }
    return child;
  }

  template({ formProps, children }) {
    return (
      <form {...formProps}>
        {isArray(children) ? children.map(this.templateChild) : this.templateChild(children)}
      </form>
    );
  }
}
