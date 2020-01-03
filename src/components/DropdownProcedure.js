import React, {Component} from 'react';
import {Dropdown} from 'semantic-ui-react';
import jsonData from "../procedure_codes.json";


let codesList=[];
function icd10Map(object) {
    for(const key in object){
        codesList.push({'key':key,'value':{name:object[key],code:key},'text':key + ' - '+ object[key]})
    }
    return codesList;
   }
export const options = icd10Map(jsonData);
let blackBorder = "blackBorder";

export default class DropdownProcedure extends Component {
  constructor(props){
    super(props);
    this.state = { currentValue: ""}
    this.handleChange = this.handleChange.bind(this);
 
  };

  handleChange = (e, { value }) => {
    // console.log(this.props);
    // console.log(options);
    // console.log(value);
    this.props.updateCB(this.props.elementName, value)
    this.setState({ currentValue: value })
  }

  render() {
    const { currentValue } = this.state
    if(currentValue){
        blackBorder = "blackBorder";
    }else{
        blackBorder = "";
    }
    return (
      <Dropdown
      className={blackBorder}
        options={options}
        placeholder='Procedure codes'
        search
        selection
        onChange={this.handleChange}
        style={{"width" : "530px"}}
      />
    )
  }
}