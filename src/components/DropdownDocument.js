
import React, { Component } from 'react';
import { Dropdown } from 'semantic-ui-react';

const defaultValues = [
  { 'key': '34117-2', 'text': 'History and Physical Note', 'value': '34117-2|History and Physical Note' },
  { 'key': '11506-3', 'text': 'Progress Note', 'value': '11506-3|Progress Note' },
  { 'key': '57133-1', 'text': 'Referral Note', 'value': '57133-1|Referral Note' },
  { 'key': '11488-4', 'text': 'Consultation Note', 'value': '11488-4|Consultation Note' },
  { 'key': '28570-0', 'text': 'Procedure Note', 'value': '28570-0|Procedure Note' },
  { 'key': '18776-5', 'text': 'Care Plan', 'value': '18776-5|Care Plan' },
  { 'key': '34133-9', 'text': 'Continuity of Care Document', 'value': '34133-9|Continuity of Care Document' }
];

function dropDownOptions() {
  return defaultValues.map((v) => { return { key: v.key, text: v.text } })
}

let blackBorder = "blackBorder";

export default class DropdownDocument extends Component {
  constructor(props) {
    super(props);
    this.state = { currentValue: "" }
    this.handleChange = this.handleChange.bind(this);

  };

  handleChange = (e, { value }) => {
    // console.log(this.props,value);
    this.props.updateCB(this.props.elementName, value)
    this.setState({ currentValue: value })
  }

  render() {
    // console.log("this.state",this.state);
    const { currentValue } = this.state;
    if (currentValue) {
      blackBorder = "blackBorder";
    } else {
      blackBorder = "";
    }
    return (
      <Dropdown
        className={blackBorder}
        options={defaultValues}
        placeholder='Select Clinical Note'
        search
        selection
        fluid
        multiple
        onChange={this.handleChange}
      />
    )
  }
}