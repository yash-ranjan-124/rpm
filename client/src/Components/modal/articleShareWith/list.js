import React, { Component } from "react";
import { injectIntl } from "react-intl";
import "../style.less";
// import messages from "./message";
import PatientCard from "../../Cards/patientCard";
import getPatientCardData from "../../../Helper/dataFormater/patientCard";
import getArticleListData from "../../../Helper/dataFormater/articleShareList";

const getPatientCards = props => {
  const {
    users = {},
    hospitals = {},
    currentUser,
    patients = [],
    close
  } = props;
  const patientCards = [];
  patients.forEach(patient => {
    const patientData = users[patient] || {};
    const formatPatientCard = getPatientCardData({
      users,
      hospitals,
      currentUser,
      patient: patientData
    });
    const { basicInfo: { _id } = {} } = patientData;
    patientCards.push(
      <div key={_id}>
        <PatientCard
          key={patient.id}
          data={formatPatientCard}
          className={"full-width i"}
          handleOnClick={true}
          onClickCard={close}
          wantCheckBox={false}
        />
      </div>
    );
  });
  return patientCards;
};

class ShareList extends Component {
  componentDidMount() {
    const { fetchProgramsData, fetchData, articleId } = this.props;
    fetchProgramsData();
    fetchData(articleId);
  }

  formatMessage = data => this.props.intl.formatMessage(data);

  render() {
    const {
      article = {},
      programs,
      users,
      hospitals,
      currentUser,
      close
    } = this.props;
    const listData = getArticleListData({
      article,
      programs,
      users,
      currentUser
    });
    return listData.map(data => {
      const { id, title, patients = [] } = data;
      return (
        <div key={id} className="mt16 mb48">
          <div className="bold dark fontsize18 mt8 mb8">{title}</div>
          {getPatientCards({ patients, users, currentUser, hospitals, close })}
        </div>
      );
    });
  }
}

export default injectIntl(ShareList);
