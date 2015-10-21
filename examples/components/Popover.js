import React from 'react';
import { Popover } from '../../src';
import { partial } from 'lodash';


const Example = React.createClass({

  propTypes: {},

  getInitialState() {
    return {
      isOpen: false
    };
  },

  toggle(isOpen) {
    this.setState({ isOpen });
  },

  getTemplate() {
    const content = (
      <div style={{backgroundColor: 'yellow', width: 200}}>
        <div>
          Popover Title
        </div>
        <div>
          <p>SONO</p>
          <p>UN</p>
          <p>POPOVER</p>
        </div>
      </div>
    );
    return (
      <div>
        <div style={{marginTop: 200, marginLeft: 130}}>
          <Popover popover={{content, position: 'bottom', anchor: 'end', attachToBody: false, event: 'click', offsetX: 0, distance: 15, offsetY: -15, isOpen:this.state.isOpen, onShow:partial(this.toggle, true), onHide:partial(this.toggle, false)}}>
            <button ref='target' style={{backgroundColor: 'green', display: 'inline-block'}}>
              ABSOLUTE
            </button>
          </Popover>
        </div>
        <div style={{marginTop: 200, marginLeft: 130}}>
          <Popover popover={{content, position: 'right', anchor: 'center', distance: 15, offsetY: 0, offsetX: -15}}>
            <button ref='target' style={{backgroundColor: 'green', display: 'inline-block'}}>
              RELATIVE
            </button>
          </Popover>
        </div>
      </div>
    );
  },

  render() {
    return this.getTemplate();
  }

});

export default Example;
