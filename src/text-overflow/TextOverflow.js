import React from 'react';
import ReactDOM from 'react-dom';
import omit from 'lodash/omit';
import { props, t } from '../utils';
import { warn } from '../utils/log';
import Popover from '../popover/Popover';
import ResizeSensor from '../resize-sensor/ResizeSensor';

/**
 * ### Text view which, if string content is too large, trims it and shows the full content on "hover" with a `Popover` (or custom component if any)
 */
@props({
  /**
   * in case you want to use a custom component (like a `Tooltip`) to render the full content which is passed as the first argument
   */
  children: t.maybe(t.Function),
  /**
   * this is the full string
   */
  label: t.String,
  lazy: t.maybe(t.Boolean),
  delayWhenLazy: t.maybe(t.Integer),
  id: t.maybe(t.String),
  className: t.maybe(t.String),
  style: t.maybe(t.Object)
}, { strict: false })
export default class TextOverflow extends React.Component {

  static defaultProps = {
    delayWhenLazy: 100
  }

  state = { isOverflowing: false };

  componentDidMount() {
    !this.props.lazy && this.verifyOverflow();
  }

  componentWillReceiveProps = (nextProps) => {
    if (!this.props.lazy && nextProps.label !== this.props.label) {
      this.reset();
    }
  };

  reset = () => this.setState({
    isOverflowing: false
  }, () => this.verifyOverflow({ force: true, reset: true }));

  logWarnings = () => {
    warn(() => {
      const node = ReactDOM.findDOMNode(this.refs.text);
      if (node) {
        const styleNode = node.parentNode.parentNode;
        const { width, flex } = styleNode.style;
        const flexBasis = flex ? flex.split(' ')[2] : null;
        if (width !== '100%' && flexBasis !== '100%') {
          return ['WARNING: TextOverflow\'s parent doesn\'t have "width: 100%" nor "flex-basis: 100%"', styleNode];
        }
      }
    });
  };

  getElementWidth = element => {
    if (element && typeof window !== 'undefined') {
      return parseFloat(window.getComputedStyle(element).width);
    }
    return null;
  };

  verifyOverflow = ({ force, reset } = {}) => {
    if ((force || (!this.props.lazy && this.state.isOverflowing === false)) && typeof window !== 'undefined') {
      const text = ReactDOM.findDOMNode(this.refs.text);
      const textWithoutEllipsis = ReactDOM.findDOMNode(this.refs.textWithoutEllipsis);

      if (text && textWithoutEllipsis) {
        const textWidth = this.getElementWidth(text);
        const textWithoutEllipsisWidth = this.getElementWidth(textWithoutEllipsis);

        const isOverflowing = (textWidth < textWithoutEllipsisWidth);
        if (isOverflowing && !this.state.isOverflowing) {
          this.setState({ isOverflowing: true }, this.logWarnings);
        } else if (!isOverflowing && reset && this.state.isOverflowing) {
          this.setState({ isOverflowing: false }, this.logWarnings);
        } else {
          this.logWarnings();
        }
      }
    }
  };

  onMouseEnter = () => {
    this.setState({
      isHovering: true
    }, () => this.props.lazy && this.verifyOverflow({ force: true, reset: true }));
  }

  onMouseLeave = () => this.setState({ isHovering: false })

  onResize = () => this.verifyOverflow({ force: true, reset: true })

  getContent = () => {
    const { label, lazy } = this.props;
    const styleText = {
      display: 'block',
      whiteSpace: 'nowrap',
      width: '100%',
      overflow: 'hidden',
      OTextOverflow: 'ellipsis', // Opera
      textOverflow: 'ellipsis'
    };
    const styleTextWithoutEllipsis = {
      position: 'fixed',
      visibility: 'hidden',
      pointerEvents: 'none',
      top: 0,
      left: 0
    };
    const events = lazy && {
      onMouseEnter: this.onMouseEnter,
      onMouseLeave: this.onMouseLeave
    };

    const text = <span ref='text' {...events} style={styleText}>{label}</span>;
    return (
      <div>
        {lazy ? text : <ResizeSensor onResize={this.onResize}>{text}</ResizeSensor>}
        <span ref='textWithoutEllipsis' style={styleTextWithoutEllipsis}>{label}</span>
      </div>
    );
  };

  templateOverflow = () => {
    const {
      state: { isHovering },
      props: { children, label, style, lazy, ...other }
    } = this;

    if (children) {
      return children(this.getContent(), lazy ? isHovering : undefined);
    } else {
      const props = {
        ...other,
        popover: {
          content: label,
          event: 'hover',
          isOpen: lazy ? isHovering : undefined
        },
        style: {
          width: '100%',
          ...style
        }
      };

      return <Popover { ...props }>{this.getContent()}</Popover>;
    }
  };

  templeteStandard = () => {
    const { style, ...other } = this.props;
    const props = {
      ...omit(other, ['children', 'label', 'lazy']),
      style: {
        width: '100%',
        ...style
      }
    };

    return <div { ...props }>{this.getContent()}</div>;
  };

  render() {
    return this.state.isOverflowing ? this.templateOverflow() : this.templeteStandard();
  }

}
