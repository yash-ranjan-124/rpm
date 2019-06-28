import React, { Component, Fragment } from "react";
import Video from "twilio-video";
// import TwilioChat from "../TwilioChat";
import moment from "moment";
import UserDpPlaceholder from "../../Assets/images/ico-placeholder-userdp.svg";
import StartCallIcon from "../../Assets/images/ico-vc-start-call.png";
import EndCallIcon from "../../Assets/images/ico-vc-end-call.png";
import ChatIcon from "../../Assets/images/ico-vc-message.png";
import AudioIcon from "../../Assets/images/ico-vc-audio.png";
import VideoIcon from "../../Assets/images/ico-vc-video.png";
import VideoDisabledIcon from "../../Assets/images/ico-vc-video-off.png";
import AudioDisabledIcon from "../../Assets/images/ico-vc-audio-off.png";
import { doRequest } from "../../Helper/network";
import { Event, Twilio } from "../../Helper/urls";
import { REQUEST_TYPE, USER_CATEGORY, EVENT } from "../../constant";

import { Button, message, Icon, Spin } from "antd";

import "./style.less";

const { STATUS: { PASSED, COMPLETED } = {} } = EVENT;

export default class VideoComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      identity: null,
      roomName: "",
      roomNameErr: false, // Track error for room name TextField
      previewTracks: null,
      localMediaAvailable: false,
      hasJoinedRoom: false,
      activeRoom: "", // Track the current active room
      video2connected: false,
      participantConnected: false,
      videoEnabled: true,
      audioEnabled: true,
      status: ""
    };
    this.toggleLocalVideo = this.toggleLocalVideo.bind(this);
  }

  componentDidMount() {
    const {
      match: {
        params: { roomId }
      },
      loggedInUser,
      fetchVideoAccessToken,
      fetchEventUsers
    } = this.props;
    fetchVideoAccessToken(loggedInUser).then(result => {
      this.setState((prevState, props) => {
        return {
          identity: props.twilio.identity,
          token: props.twilio.videoToken
        };
      });
    });
    fetchEventUsers(roomId);
    //this.fetchEventDataById(roomId);
    const roomName = roomId;
    this.setState({ roomName });
  }

  fetchEventDataById = async eventId => {
    const response = await doRequest({
      method: REQUEST_TYPE.GET,
      url: Event.getEventDataById(eventId)
    });
    const { payload } = response;

    const { data: { events = {} } = {} } = payload;
    await this.setState((state, props) => ({ status: events.status }));
  };

  toggleLocalVideo(flag) {
    this.setState({ videoEnabled: !this.state.videoEnabled });
    //
    var localParticipant = this.state.activeRoom.localParticipant;
    if (flag === "disable") {
      localParticipant.videoTracks.forEach(function(videoTrack) {
        videoTrack.disable();
      });
      //var remoteContainer = this.refs.remoteMedia;
      //
      //
    } else if (flag === "enable") {
      localParticipant.videoTracks.forEach(function(videoTrack) {
        videoTrack.enable();
      });
      //
    }
  }

  toggleLocalAudio(flag) {
    this.setState({ audioEnabled: !this.state.audioEnabled });
    var localParticipant = this.state.activeRoom.localParticipant;
    if (flag === "disable") {
      localParticipant.audioTracks.forEach(function(audioTrack) {
        audioTrack.disable();
      });
    } else if (flag === "enable") {
      localParticipant.audioTracks.forEach(function(audioTrack) {
        audioTrack.enable();
      });
    }
  }

  showMessage = () => {
    message.error("Cannot join the room. This event has passed.");
  };

  joinRoom = async () => {
    const {
      match: {
        params: { roomId }
      }
    } = this.props;

    this.setState({ status: "loading" });

    await this.fetchEventDataById(roomId);
    if (!this.state.roomName.trim()) {
      this.setState({ roomNameErr: true });
      return;
    }

    let connectOptions = {
      name: this.state.roomName,
      video: { width: 1440 },
      audio: true
    };

    if (this.state.previewTracks) {
      connectOptions.tracks = this.state.previewTracks;
    }
    const { status } = this.state;

    if (status === PASSED || status === COMPLETED) {
      this.showMessage();
    } else {
      // Join the Room with the token from the server and the
      // LocalParticipant's Tracks.

      Video.connect(this.state.token, connectOptions).then(
        this.roomJoined,
        error => {
          alert("Could not connect to Twilio: " + error.message);
        }
      );
    }
  };

  attachTracks = (tracks, container) => {
    tracks.forEach(track => {
      container.appendChild(track.attach());
    });
  };

  // Attaches a track to a specified DOM container
  attachParticipantTracks = (participant, container) => {
    var tracks = Array.from(participant.tracks.values());
    this.attachTracks(tracks, container);
  };

  detachTracks = tracks => {
    tracks.forEach(track => {
      track.detach().forEach(detachedElement => {
        detachedElement.remove();
      });
    });
  };

  detachParticipantTracks = participant => {
    var tracks = Array.from(participant.tracks.values());
    this.detachTracks(tracks);
  };

  roomJoined = async room => {
    // Called when a participant joins a room

    this.setState({
      activeRoom: room,
      localMediaAvailable: true,
      hasJoinedRoom: true
    });

    const { sid } = room;

    const response = await doRequest({
      method: REQUEST_TYPE.GET,
      url: Twilio.getConnectedParticipants(sid)
    });

    const {
      payload: { data: { connectedParticipants = {} } = {} } = {}
    } = response;
    const { users, loggedInUser } = this.props;

    const userIds = Object.keys(users);
    const otherUserId = userIds.filter(id => id !== loggedInUser)[0];

    if (connectedParticipants[otherUserId] === "connected") {
      this.setState({
        video2connected: true,
        participantConnected: otherUserId,
        status: "connected"
      });
    } else {
      this.setState({ status: "waiting" });
    }
    // Attach LocalParticipant's Tracks, if not already attached.
    var previewContainer = this.refs.localMedia;

    if (!previewContainer.querySelector("video")) {
      this.attachParticipantTracks(room.localParticipant, previewContainer);
    }

    // Attach the Tracks of the Room's Participants.
    room.participants.forEach(participant => {
      var previewContainer = this.refs.remoteMedia;

      this.attachParticipantTracks(participant, previewContainer);
    });

    // When a Participant joins the Room, log the event.
    room.on("participantConnected", participant => {
      this.setState({
        video2connected: true,
        participantConnected: participant.identity,
        status: "Call Started"
      });
    });

    // When a Participant adds a Track, attach it to the DOM.
    room.on("trackAdded", (track, participant) => {
      var previewContainer = this.refs.remoteMedia;
      this.attachTracks([track], previewContainer);
    });

    // When a Participant removes a Track, detach it from the DOM.
    room.on("trackRemoved", (track, participant) => {
      //

      this.detachTracks([track]);
    });

    // When a Participant leaves the Room, detach its Tracks.
    room.on("participantDisconnected", participant => {
      this.detachParticipantTracks(participant);
      this.setState({
        video2connected: false,
        participantConnected: false,
        status: "partcipantDisconnected"
      });
    });

    // Once the LocalParticipant leaves the room, detach the Tracks
    // of all Participants, including that of the LocalParticipant.
    room.on("disconnected", () => {
      if (this.state.previewTracks) {
        this.state.previewTracks.forEach(track => {
          track.stop();
        });
      }
      this.detachParticipantTracks(room.localParticipant);
      room.participants.forEach(this.detachParticipantTracks);
      this.setState({
        activeRoom: null,
        hasJoinedRoom: false,
        localMediaAvailable: false,
        video2connected: false,
        participantConnected: false,
        status: "Appointment done"
      });
    });
  };

  leaveRoom = () => {
    if (
      this.state.activeRoom !== null &&
      this.state.activeRoom !== "" &&
      this.state.activeRoom.disconnect
    ) {
      this.state.activeRoom.disconnect();
    }
    this.setState({ hasJoinedRoom: false, localMediaAvailable: false });
    this.props.hideChat();
  };

  componentDidUpdate(prevProps, prevState) {
    const {
      video2connected,
      participantConnected,
      roomName: eventId
    } = this.state;
    const { loggedInUser, addVideoRoomParticipantsInEvent } = this.props;
    if (video2connected) {
      addVideoRoomParticipantsInEvent(
        eventId,
        participantConnected,
        loggedInUser
      );
    }
  }

  componentWillUnmount() {
    this.leaveRoom();
  }

  getOtherParticipantData() {
    const { users, loggedInUser } = this.props;

    const userIds = Object.keys(users);
    const otherUserId = userIds.filter(id => id !== loggedInUser)[0];
    if (otherUserId) {
      const { basicInfo } = users[otherUserId] || {};
      const {
        profilePicLink: profilePic = UserDpPlaceholder,
        name,
        category
      } = basicInfo;

      if (category !== USER_CATEGORY.PATIENT) {
        return { profilePic: profilePic, name, category };
      } else if (category === USER_CATEGORY.PATIENT) {
        const {
          personalInfo: { dob, gender }
        } = users[otherUserId] || {};
        const age = moment().diff(dob, "years", false);
        return { profilePic: profilePic, name, category, age, gender };
      }
    }
  }

  render() {
    const otherUserdata = this.getOtherParticipantData();
    // Only show video track after user has joined a room
    let showLocalTrack = this.state.localMediaAvailable ? (
      <div className="videoWrapper" ref="localMedia" />
    ) : (
      ""
    );
    // Hide 'Join Room' button if user has already joined a room.
    // eslint-disable-next-line no-unused-vars
    let joinOrLeaveRoomButton = this.state.hasJoinedRoom ? (
      <Button type="danger" onClick={this.leaveRoom}>
        Leave Room
      </Button>
    ) : (
      <Button type="primary" onClick={this.joinRoom}>
        Join Room
      </Button>
    );

    const antIcon = <Icon type="loading" style={{ fontSize: 24 }} spin />;

    const {
      video2connected,
      participantConnected,
      hasJoinedRoom,
      status
    } = this.state;
    const { users, showChatBox } = this.props;
    const user =
      participantConnected && users[participantConnected]
        ? users[participantConnected]
        : {};

    const {
      basicInfo: { profilePicLink: profilePic = UserDpPlaceholder, name } = {}
    } = user;

    let showWaitngMsg = false;
    if (hasJoinedRoom) {
      if (
        (status === "waiting" || !video2connected) &&
        (status !== "loading" && status !== "started")
      ) {
        showWaitngMsg = true;
      }
    }

    return (
      <div
        style={{
          height: "100%",
          width: "100%",
          backgroundColor: "black",
          position: "fixed",
          top: 0,
          left: 0
        }}
      >
        <div ref="remoteMedia" id="remote-media" />
        {(status === "loading" || status === "started") && (
          <Spin
            indicator={antIcon}
            className="loadingForUser flex align-items-center justify-content-center ml16"
          />
        )}

        <div
          style={{
            position: "absolute",
            bottom: 32,
            right: 32,
            height: 180,
            width: 250
          }}
        >
          {showLocalTrack}
        </div>
        {this.state.hasJoinedRoom ? (
          <div>
            <img
              src={ChatIcon}
              style={{
                position: "absolute",
                bottom: 32,
                left: 32,
                cursor: "pointer"
              }}
              alt="chatIcon"
              onClick={this.props.showChat}
            />
            <div
              style={
                participantConnected && video2connected
                  ? {
                      position: "absolute",
                      top: 32,
                      left: showChatBox ? 400 : 32,
                      cursor: "pointer"
                    }
                  : { display: "none" }
              }
            >
              <img
                style={{ height: "40px", width: "40px" }}
                src={profilePic}
                alt="chatIcon"
              />{" "}
              <span
                style={{ fontSize: "14px", color: "white", padding: "10px" }}
              >
                {name}
              </span>
            </div>
            {showWaitngMsg && (
              <div className="flex column align-items-center justify-content-center WaitingForUser">
                <div className="mb10">
                  <img
                    src={otherUserdata.profilePic}
                    style={{
                      cursor: "pointer",
                      marginLeft: 24,
                      height: "94px",
                      width: "96px"
                    }}
                    alt="userDp"
                  />
                </div>

                <div>
                  {otherUserdata.category !== USER_CATEGORY.PATIENT ? (
                    <span className="fontsize14 white">
                      {status !== "partcipantDisconnected"
                        ? `Waiting for ${otherUserdata.name}`
                        : `Reconnecting to ${otherUserdata.name}`}
                    </span>
                  ) : (
                    <span className="fontsize14 white">
                      {status !== "partcipantDisconnected"
                        ? ` Waiting for ${otherUserdata.name} (${
                            otherUserdata.age
                          }, ${otherUserdata.gender})`
                        : `Reconnecting to ${otherUserdata.name} (${
                            otherUserdata.age
                          }, ${otherUserdata.gender})`}
                    </span>
                  )}
                </div>
              </div>
            )}
            <div style={{ position: "absolute", bottom: 32, right: "41%" }}>
              {this.state.videoEnabled ? (
                <img
                  src={VideoIcon}
                  style={{ cursor: "pointer", marginLeft: 24 }}
                  onClick={() => this.toggleLocalVideo("disable")}
                  alt="chatIcon"
                />
              ) : (
                <img
                  src={VideoDisabledIcon}
                  style={{ cursor: "pointer", marginLeft: 24 }}
                  onClick={() => this.toggleLocalVideo("enable")}
                  alt="chatIcon"
                />
              )}
              {this.state.audioEnabled ? (
                <img
                  src={AudioIcon}
                  style={{ cursor: "pointer", marginLeft: 24 }}
                  onClick={() => this.toggleLocalAudio("disable")}
                  alt="chatIcon"
                />
              ) : (
                <img
                  src={AudioDisabledIcon}
                  style={{ cursor: "pointer", marginLeft: 24 }}
                  onClick={() => this.toggleLocalAudio("enable")}
                  alt="chatIcon"
                />
              )}

              <img
                src={EndCallIcon}
                style={{ cursor: "pointer", marginLeft: 24 }}
                onClick={this.leaveRoom}
                alt="chatIcon"
              />
            </div>
          </div>
        ) : (
          <Fragment>
            <img
              src={StartCallIcon}
              style={{ position: "absolute", bottom: 32, cursor: "pointer" }}
              onClick={this.joinRoom}
              alt="chatIcon"
            />
          </Fragment>
        )}
      </div>
    );
  }
}
