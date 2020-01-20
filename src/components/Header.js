
import React, { Component } from 'react';
import logo from "../Palm_GBA_H.JPG";

export class Header extends Component {
    constructor(props) {
        super(props);
        this.state = {
        }
    }
    render() {
        return (
            <header id="inpageheader">
                <div className="">
                    <div id="logo" className="pull-left">
                        {this.state.currentPayer !== '' &&
                            <h1><img style={{ height: "60px", marginTop: "-13px" }} src={logo} /><a href="#intro" className="scrollto">{this.props.payer}</a></h1>
                        }
                    </div>
                    <nav id="nav-menu-container">
                        <ul className="nav-menu">
                            <li className="menu-has-children"><a href="">Request</a>
                                <ul>
                                    <li><a href={window.location.protocol + "//" + window.location.host + "/request"}>Request for documents</a></li>
                                    <li><a href={window.location.protocol + "//" + window.location.host + "/care_gaps"}>Request Care Gaps</a></li>
                                </ul>
                            </li>
                            <li className="menu-has-children"><a href="">TASKS</a>
                                <ul>
                                    <li><a href={window.location.protocol + "//" + window.location.host + "/pdex_documents"}>Coverage Documents</a></li>
                                    <li><a href={window.location.protocol + "//" + window.location.host + "/cdex_documents"}>Clinical Documents</a></li>
                                    <li><a href={window.location.protocol + "//" + window.location.host + "/task"}>Transfer Coverage Documents</a></li>
                                </ul>
                            </li>
                            <li><a href={window.location.protocol + "//" + window.location.host + "/configuration"}>Configuration</a></li>
                            <li className="menu-has-children"><a href="">{sessionStorage.getItem('username')}</a>
                                <ul>
                                    <li><a href="" onClick={this.onClickLogout}>Logout</a></li>
                                </ul>
                            </li>
                        </ul>
                    </nav>
                </div>
            </header>
        )
    }
}