import React, { Component } from 'react';
import DisplayPatientData from '../components//DisplayPatientData';


export default class DisplayBundle extends Component {
    constructor(props) {
        super(props);

        this.state = {

            //   name:'',
            //   gender:'',
            //   address:'',
            //   postalCode:'',
            //   state:'',
            //   birthDate:''
            //   measure:props.getStore().costMeasures.measure,
            //   measureList: props.getStore().costMeasures.measureList,
            //   costMeasures: props.getStore().costMeasures,
            //   measureOptions: props.getStore().costMeasures.measureOptions,
            //   measureObj:{}


        };

    }
    componentDidMount() { }

    render() {
        return (
            this.props.finaldata.map((e, k) => {
                return (<DisplayPatientData data={e} id={k} />)
            })
        )

    }
}