/**
 * Copyright (c) 2015-present, Alibaba Group Holding Limited.
 * All rights reserved.
 *
 * @providesModule ReactPicker
 */
'use strict';

import React, { Component, PropTypes } from 'react';
import StyleSheet from 'ReactStyleSheet';
import autobind from 'autobind-decorator';
import View from 'ReactView';
import Text from 'ReactText';
import TouchableWithoutFeedback from 'ReactTouchableWithoutFeedback';

const PICKER = 'picker';

class Picker extends Component {
  static propTypes = {
    onValueChange: PropTypes.func,
    selectedValue: PropTypes.any, // string or integer basically
    isRenderSelect: PropTypes.bool
  }

  static defaultProps = {
    isRenderSelect: false
  }

  _onChange(event) {
    if (this.props.onChange) {
      this.props.onChange(event);
    }

    if (this.props.onValueChange) {
      this.props.onValueChange(this.refs[PICKER].value);
    }
  }

  render() {
    if (this.props.isRenderSelect) {
      return (
        <select
          ref={PICKER}
          value={this.props.selectedValue}
          style={{
            color: 'inherit',
            font: 'inherit',
            ...this.props.style}}
          onChange={this._onChange}
        >
        {this.props.children}
        </select>
      );
    } else {
      let label;
      if (this.props.children.length > 0) {
        if (!!this.props.selectedValue) {
          for (let i = 0; i < this.props.children.length; i++) {
            if (this.props.selectedValue == this.props.children[i].props.value) {
              label = this.props.children[i].props.label;
              break;
            }
          }
        } else {
          label = this.props.children[0].props.label;
        }
      }

      return (
        <TouchableWithoutFeedback onPress={()=>this.refs[PICKER].click()}>
        <View style={this.props.style}>
          <Text ref={'picker_label'} style={{position:'absolute',top:0,left:0,right:0,bottom:0}}>{label}</Text>
          <select
            ref={PICKER}
            value={this.props.selectedValue}
            style={{
              flex: 1,
              opacity: 0,
              }}
            onChange={(event)=>{
              let c = this.refs[PICKER];
              let ct = c.options[c.selectedIndex].text;
              this.setState({});
              // this.refs.picker_label.refs.text.value = ct;
              this._onChange(event); 
            } }
          >
          {this.props.children}
          </select>
        </View>
        </TouchableWithoutFeedback>
      );
    }
  }
};

Picker.Item = React.createClass({
  propTypes: {
    value: PropTypes.any, // string or integer basically
    label: PropTypes.string,
  },

  render: function() {
    return <option value={this.props.value}>{this.props.label}</option>;
  },
});

autobind(Picker);

Picker.isReactNativeComponent = true;

export default Picker;
