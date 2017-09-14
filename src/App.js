/*global AudioContext*/
import React, { Component } from 'react';
import './App.css';
import 'webrtc-adapter';
import { Delay, Input, Reverb, Volume } from 'audio-effects';
import YouTube from 'react-youtube';

class App extends Component {
  render() {
    return (
      <div className="App">
        <VideoPlayer />
        <MicrophoneList />
      </div>
    );
  }
}

export default App;

class VideoPlayer extends Component {
  constructor (props) {
    super(props);
    this.state = {
      player: null,
      videoId: '',
      playerVars: {
        autoplay: 1
      }
    };
    this.onReady = this.onReady.bind(this);
    this.onInput = this.onInput.bind(this);
  }
  render () {
    const opts = {
      height: '390',
      width: '640'
    };
    return (
        <div>
        <input type="text" onChange={this.onInput} />
        <YouTube
          videoId={this.state.videoId}
          opts={opts}
          onReady={this.onReady}
          />
      </div>
    );
  }
  onInput (event) {
    this.playVideo(event.target.value);
  }
  onReady (event) {
    this.setState({player: event.target});
  }
  playVideo (videoId) {
    console.log(`playing video ${videoId}`);
    this.setState({videoId});
  }
}

class MicrophoneList extends Component {
  constructor (props) {
    super(props);
    this.state = {
      context: null,
      mics: []
    };
    this.addMic = this.addMic.bind(this);
  }
  componentDidMount() {
    this.setState({context: new AudioContext()});
  }
  componentWillUnmount() {
    this.state.context.close();
  }
  addMic() {
    let mics = this.state.mics;
    getMicrophone(this.state.context).then((mic) => {
      this.setState({mics: mics.concat(mic)});
    });
  }
  render () {
    const mics = this.state.mics.map((mic, index) => <li key={mic.id}><MicrophoneListEntry mic={mic} index={index}/></li>);
    return (
        <div className="mic-list"><button onClick={ this.addMic }>Add a Mic</button>
        <ul className="mic-list-entries">
        {mics}
        </ul>
        </div>
    );
  }
}

function getMicrophone(context) {
  var input = new Input(context);
  return input.getUserMedia({audio: true}).then((stream) => {
    return new Microphone(context, input, stream.id);
  });
}

class Microphone {
  constructor (context, input, id) {
    var volume = new Volume(context);
    volume.level = 0.5;
    var reverb = new Reverb(context);
    reverb.wet = 0.5;
    reverb.level = 0.5;
    var delay = new Delay(context);
    delay.wet = 1;
    delay.speed = 0.05;
    delay.duration = 0.4;
    input.connect(reverb);
    reverb.connect(delay);
    delay.connect(volume);
    volume.connect(context.destination);
    this.id = id;
    this._input = input;
    this._reverb = reverb;
    this._delay = delay;
    this._volume = volume;
  }
  get volume() {
    return this._volume.level;
  }
  set volume(level) {
    this._volume.level = Math.max(Math.min(level, 1), 0);
  }
  get reverb() {
    return this._reverb.level;
  }
  set reverb(level) {
    this._reverb.level = Math.max(Math.min(level, 1), 0);
  }
  get delay() {
    return this._delay.speed;
  }
  set delay(level) {
    this._delay.speed = Math.max(Math.min(level, 0.5), 0);
  }
}

class MicrophoneListEntry extends Component {
  constructor (props) {
    super(props);
    this.state = {
      mic: props.mic,
      index: props.index
    };
    this.volumeChanged = (event) => {
      let mic = this.state.mic;
      mic.volume = event.target.value;
      this.setState({mic});
    };
    this.reverbChanged = (event) => {
      let mic = this.state.mic;
      mic.reverb = event.target.value;
      this.setState({mic});
    };
    this.delayChanged = (event) => {
      let mic = this.state.mic;
      mic.delay = event.target.value;
      this.setState({mic});
    };
  }
  componentDidMount() {
  }
  componentWillUnmount() {
  }
  render () {
    return (
      <div className="mic-list-entry">Mic {this.props.index + 1}
        <br /><label>Volume: <input type="range" min="0" max="1" step="0.1" value={this.props.mic.volume} onChange={this.volumeChanged} /></label>
        <br /><label>Reverb: <input type="range" min="0" max="1" step="0.1" value={this.props.mic.reverb} onChange={this.reverbChanged} /></label>
        <br /><label>Delay: <input type="range" min="0" max="0.5" step="0.01" value={this.props.mic.delay} onChange={this.delayChanged} /></label>
      </div>
    );
  }
}
