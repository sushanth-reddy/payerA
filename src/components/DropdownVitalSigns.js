import React, {Component} from 'react';
import {Dropdown} from 'semantic-ui-react';

const defaultValues =[
  { 'key': '9279-1', 'text': 'Respiratory Rate','value': '9279-1|Respiratory Rate' },
  { 'key': '8867-4', 'text': 'Heart rate','value': '8867-4|Heart rate' },
  { 'key': '59408-5', 'text': 'Oxygen saturation','value': '59408-5|Oxygen saturation' },
  { 'key': '8310-5', 'text': 'Body temperature','value': '8310-5|Body temperature' },
  { 'key': '8302-2', 'text': 'Body height','value': '8302-2|Body height' },
  { 'key': '8306-3', 'text': 'Body length','value': '8306-3|Body length' },
  { 'key': '8287-5', 'text': 'Head circumference','value': '8287-5|Head circumference' },
  { 'key': '29463-7', 'text': 'Body weight','value': '29463-7|Body weight'},
  { 'key': '39156-5', 'text': 'Body mass index','value': '39156-5|Body mass index' },
  { 'key': '55284-4', 'text': 'Blood pressure systolic and diastolic','value': '55284-4|Blood pressure systolic and diastolic' },
  { 'key': '8480-6', 'text': 'Systolic blood pressure','value': '8480-6|Systolic blood pressure' },
  { 'key': '8462-4', 'text': 'Diastolic blood pressure', 'value': '8462-4|Diastolic blood pressure' },
  { 'key': '8478-0', 'text': 'Mean blood pressure', 'value': '8478-0|Mean blood pressure' }
  ];

function dropDownOptions() {
  return defaultValues.map((v) => {return {key: v.key, text: v.text,value: v.value}})
}

let blackBorder = "blackBorder";


export default class DropdownDocument extends Component {
  constructor(props){
    super(props);
    this.state = { currentValue: ""}
    this.handleChange = this.handleChange.bind(this);  
  };

  handleChange = (event,{value}) => {
    // console.log(this.props);
    // console.log(event.currentValue,'eventtt',value)
    this.props.updateCB(this.props.elementName, value)
    this.setState({ currentValue: value })
  }

  render() {
    // console.log("this.state",this.state);
    const { currentValue } = this.state;
    if(currentValue){
        blackBorder = "blackBorder";
    }else{
        blackBorder = "";
    }
    return (
      <Dropdown
      className={blackBorder}
        options={defaultValues}
        placeholder='Select Reason'
        search
        selection
        fluid
        multiple
        onChange={this.handleChange}
      />
    )
  }
}