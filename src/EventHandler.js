import React from 'react';
import { includes, partial } from 'lodash';


export default React.createClass({

  propTypes: {
    children: React.PropTypes.oneOfType([
      React.PropTypes.func,
      React.PropTypes.node
    ]).isRequired,
    listeners: React.PropTypes.array.isRequired
  },

  getInitialState() {
    return {
      activeListeners: []
    };
  },

  componentDidMount() {
    this.updateListeners();
  },

  getChildNode() {
    return this.getDOMNode();
  },

  updateListeners(props) {
    props = props || this.props;
    const { listeners } = props;
    const { activeListeners } = this.state;
    const events = listeners.map(l => l.event);
    const activeEvents = activeListeners.map(l => l.event);
    // add new
    listeners.forEach(l => {
      if (!includes(activeEvents, l.event)) {
        console.log('adding');
        window.addEventListener(l.event, partial(this.onEvent, l));
      }
    });
    // prune old
    activeListeners.forEach(al => {
      if (!includes(events, al.event)) {
        window.removeEventListener(al.event, partial(this.onEvent, al));
      }
    });
    this.setState({ activeListeners: listeners });
  },

  removeListeners() {
    const { activeListeners } = this.state;
    activeListeners.forEach(al => window.removeEventListener(al.event, partial(this.onEvent, al)));
  },

  onEvent(l, e) {
    const el = e.target || e.srcElement;
    return l.onEvent(e, this.isEventInsideChildNode(el), l);
  },

  isEventInsideChildNode(el) {
    if (el === this.getChildNode()) {
      return true;
    } else if (el.parentNode) {
      return this.isEventInsideChildNode(el.parentNode);
    } else {
      return false;
    }
  },

  render() {
    return this.props.children;
  },

  componentWillReceiveProps(nextProps) {
    this.updateListeners(nextProps);
  },

  componentWillUnmount() {
    this.removeListeners();
  }

});