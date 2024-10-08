import React, { Component } from 'react';
import { Card, Form, Grid, Image, Modal, Button, Label, Input, Segment, Icon, Pagination, Dropdown } from 'semantic-ui-react';
import axios from 'axios';
import { io } from 'socket.io-client';
import "../styles/customCss.css"

export default class ApiForm extends Component {
  constructor(props) {
    super(props);

    this.state = {
      userGuess: '',
      musicData: {},
      dropdownData: [],
      video: '',
      selectedsong: {},
      guessedSong: '',
      AllPlayerPoints: {},
      roundCount: 0,

      dropdownOptions: [],
      roomName: 'public_server',
      connectionError: false,
      points: 0,
      clients: 0,
      timerinterval: 0,
      username: '',
      showUsernamePopup: true,
      connectedClients: [],
      showModal: false,
      winnerUsernames: '',
      winnerPoints: 0,
      skin: 0,
      countdownPlaying: false,
      remainingTime: 20,
      loadingNextSong: false,
      timerInterval: null,
      timerStart: 20,
      circleProgress: 0, // Neue Zustand für die Kreisanimation
      isPaused: false, // Neue Zustand für den Pause-Status
      currentRound: 0,
      maxRounds: 0,
      gameBefore: '',
      songBefore: '',
      guesses:{},
      showStartButton: true, 
      winners: [],
      winnerInfo: '',
      message: '',
      chatMessages: [],
      selectedSkin: '',
      skins: [],
      activePage: 1,
      itemsPerPage: 6,
      showVideo: false,
      timerFinished: false

    };

    //this.socket = io('localhost:5002');
    this.socket = io('https://vmq-server.onrender.com');
    this.startGame = this.startGame.bind(this);
  
    this.handleUsernameSubmit = this.handleUsernameSubmit.bind(this);
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.chatMessages.length !== this.state.chatMessages.length) {
      this.scrollToBottom();
    }
  }

  scrollToBottom = () => {
    this.messagesEnd.scrollIntoView({ behavior: 'smooth' });
  };

  componentDidMount() {
    axios.get('https://vmq.onrender.com/getAll')
      .then(res => {
        this.setState({ musicData: res.data });

        for (let i = 0; i < this.state.musicData.length; i++) {
          this.state.dropdownData.push(this.state.musicData[i].game);
        }

        for (let j = 0; j < this.state.dropdownData.length; j++) {
          this.state.dropdownOptions.push({ key: this.state.dropdownData[j], text: this.state.dropdownData[j], value: this.state.dropdownData[j] });
        }
      })
      .catch(function (error) {
        console.log(error);
      });


      axios.get('https://raw.githubusercontent.com/Eder03/vmq_skins/main/skins.json')
      .then(res => {
        this.setState({ skins: res.data });
      })
      .catch(function (error) {
        console.log(error);
      });











    this.socket.on('updatePoints', (clients) => {
      this.setState({ connectedClients: clients });
    });

    this.socket.on('updateClients', (clients) => {
      this.setState({ connectedClients: clients });
      this.setState({ clients: this.state.connectedClients.length });
    });

    this.socket.on('gameStarted', (selectedSong, maxRounds) => {
      if(Object.keys(this.state.selectedsong).length != 0){
        this.setState({gameBefore: this.state.selectedsong.currentGame})
        this.setState({songBefore: this.state.selectedsong.currentSong.name})
      }
      
      this.setState({ selectedsong: selectedSong, loadingNextSong: false });
      this.setState({maxRounds: maxRounds});
      this.setState(prevState => ({
        roundCount: prevState.roundCount + 1
      }));
      this.resetGuesses()
      this.resetDropdown();
    });

    this.socket.on('nextSongLoaded', (selectedSong) => {
      
      this.setState({ selectedsong: selectedSong, loadingNextSong: false });
      this.setState(prevState => ({
        roundCount: prevState.roundCount + 1
      }));
      this.resetGuesses()
      this.resetDropdown();
    });

    this.socket.on('winnerAnnounced', (winners) => {
      // Überprüfe, ob winners ein Array ist und lege es gegebenenfalls fest
      if (!Array.isArray(winners)) {
        winners = [winners];
      }
    
      // Extrahiere nur die Benutzernamen der Gewinner
      const winnerNames = winners.map(winner => winner.username);
    
      // Extrahiere die Punkte des ersten Gewinners (falls es mehrere gibt, haben sie die gleiche Punktzahl)
      const points = winners.length > 0 ? winners[0].points : 0;
    
      // Setze den Zustand, um das Modal anzuzeigen und die Gewinnerinformationen zu speichern
      if (winners.length === 1) {
        this.setState({ 
          showModal: true,
          winnerInfo: `Der Gewinner ist ${winnerNames[0]} mit ${points} Punkten${winners.length > 1 ? 'en' : ''}!`,
          showStartButton: true 
        });
      } else {
        this.setState({ 
          showModal: true,
          winnerInfo: `Die Gewinner sind ${winnerNames.join(', ')} mit ${points} Punkt${winners.length > 1 ? 'en' : ''}!`,
          showStartButton: true 
        });
      }
    });
    
    

    this.socket.on('startTimer', ({ remainingTime }) => {
      this.setState({ remainingTime, countdownPlaying: true, timerFinished: false });
      this.startTimerAnimation();
      this.resetGuesses()
      this.resetDropdown();
    });

    this.socket.on('updateTimer', ({ remainingTime }) => {
      this.setState({ remainingTime });
    });

    this.socket.on('timerFinished', () => {
      this.setState({ countdownPlaying: false, loadingNextSong: true, timerFinished: true });
      this.guessSong();
      this.sendPoints();
    });

    this.socket.on('nextSongLoading', () => {
      this.setState({ remainingTime: 7 });
      setTimeout(() => {
        this.setState({ countdownPlaying: true });
      }, 7000);
    });

    this.socket.on('updateGuesses', ({ username, guess, isCorrect }) => {
      this.updateGuesses(username, guess, isCorrect);
    });

    this.socket.on('resetGameState', () => {
      this.resetGameState();
    });

    this.socket.on('hideStartButton', () => {
      this.setState({ showStartButton: false });
    });

    this.socket.on('resetPoints', () => {
      this.resetPoints();
    });

    this.socket.on('receiveMessage', (message) => {
      this.setState(prevState => ({
        chatMessages: [...prevState.chatMessages, message]
      }));
    });
  }

  componentWillUnmount() {
    clearInterval(this.state.timerInterval);
  }

  updateGuesses = (username, guess, isCorrect) => {
    this.setState(prevState => ({
      guesses: {
        ...prevState.guesses,
        [username]: { guess, isCorrect }
      }
    }));
  };

  resetGuesses = () => {
    this.setState({ guesses: {} });
  };

  resetDropdown = () => {
    this.setState({ userGuess: '' });
  };

  handleSendMessage = () => {
    const message = { username: this.state.username, message: this.state.message };
    this.socket.emit('sendMessage', message);
    this.setState({ message: '' });
  };

  handleMessageChange = (e) => {
    this.setState({ message: e.target.value });
  };

  handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      this.handleSendMessage();
    }
  };

  
  

  startTimerAnimation = () => {
    this.setState({isPaused: false})
    const { timerStart } = this.state;
    const intervalDuration = 1000 / timerStart;
    this.setState({showVideo: false})

    const timerInterval = setInterval(() => {
      const { remainingTime, countdownPlaying } = this.state;

      if (countdownPlaying && remainingTime > 0) {
        const timePercentage = (remainingTime / timerStart) * 100;
        const circleProgress = 2 * Math.PI * 45 * (1 - timePercentage / 100);
        this.setState({ circleProgress });
      } else {
        clearInterval(timerInterval);
        this.setState({ circleProgress: 2 * Math.PI * 45 });
        
          this.setState({ showVideo: true });
          this.setState({isPaused: true})
        
      }
    }, intervalDuration);

    this.setState({ timerInterval });
  };

  guessSong = () => {
    const { userGuess, selectedsong, username } = this.state;
    const isCorrect = userGuess === selectedsong.currentGame.game;
  
    if (isCorrect) {
      this.setState(prevState => ({
        points: prevState.points + 1
      }), () => {
        this.sendPoints(); // Send points after state update
      });
    } else {
      this.sendPoints(); // Also send points if guess is incorrect
    }
  
  
    this.setState({gameBefore: this.state.selectedsong.currentGame})
    this.setState({songBefore: this.state.selectedsong.currentSong.name})

    // Guesses aktualisieren
    this.updateGuesses(username, userGuess, isCorrect);
    
    // Informiere den Server über den Guess
    this.socket.emit('userGuess', { username, guess: userGuess, isCorrect });
  };

  sendPoints = () => {
    const points = this.state.points;
    this.socket.emit('sendPoints', { points });
  }


  

  handleUsernameSubmit = () => {
    const { username, selectedSkin } = this.state;
    this.setState({ showUsernamePopup: false });
    this.socket.emit('setUsername', username, selectedSkin);
  };

  onChangeDropdown = (e, { value }) => this.setState({ userGuess: value });

  onSubmit(e) { }

   startGame(e) {
    this.socket.emit('resetGameAndPoints');
    this.socket.emit('startGameAndHideButton');
    this.socket.emit('startGame');
    this.setState({ showStartButton: false });
  }

  resetGameState = () => {
    this.setState({
      userGuess: '',
      guessedSong: '',
      AllPlayerPoints: {},
      roundCount: 0,
      points: 0,
      timerinterval: 0,
      countdownPlaying: false,
      remainingTime: 20,
      loadingNextSong: false,
      timerInterval: null,
      circleProgress: 0,
      isPaused: false,
      guesses: {},
      showModal: false,
      selectedsong: {}
    });
    this.sendPoints();
  }

  resetPoints = () => {
    this.setState({
      points: 0
    });
    this.sendPoints();
  }

  renderResult() {
    return (
      <div style={{ marginTop: '5px', width: '300px', backgroundColor: "#1a1a1d" }}>
        <Segment compact style={{backgroundColor: "#36343B", color: "#FFFFF0"}}>
          <Label style={{backgroundColor: "#2b2b33", color: "#FFFFF0"}}>Last game info</Label>
          <br />
          <br />
          <b>Game: </b> {this.state.gameBefore.game}
          <br />
          <br />
          <b>Gameseries: </b> {this.state.gameBefore.series}
          <br />
          <br />
          <b>Song: </b> {this.state.songBefore}
        </Segment>
      </div>
    );
  }

  handleSkinSelect = (skinUrl) => {
    this.setState({ selectedSkin: skinUrl });
  };

  handlePageChange = (e, { activePage }) => {
    this.setState({ activePage });
  };
  
  
  
  

  render() {
    const { username, activePage, itemsPerPage, skins, selectedSkin, message, chatMessages, winners, winnerInfo, guesses, clients, points, countdownPlaying, remainingTime, loadingNextSong, selectedsong, connectedClients, showModal, winnerUsernames, winnerPoints, circleProgress, isPaused, roundCount, maxRounds } = this.state;
  
    
  
    const textStyle = {
      fontSize: '14px',
      dominantBaseline: 'middle',
      textAnchor: 'middle',
      fill: 'white',
      color: 'white'
    };
  
    const roundInfoStyle = {
      position: 'absolute',
      top: '60px',  // Adjusted top value to add space between navbar and round info
      right: '10px',
      zIndex: 1000,
    };
  
    const resultStyle = {
      position: 'absolute',
      top: '50px',
      left: '10px',
      padding: '10px',
      backgroundColor: '#1a1a1d',
      zIndex: 1000,
      width: '300px',
    };

    const svgStyle = {
      width: '120px',
      height: '120px',
    };
  
    const circleStyle = {
      transition: 'stroke-dashoffset 1s ease-in-out',
      strokeDasharray: `${2 * Math.PI * 45}`,
      strokeDashoffset: circleProgress,
      transform: 'rotate(-90deg)',
      transformOrigin: 'center',
    };

    const timerBoxStyle = {
      width: '391.111px',
      height: '220px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      border: '3px solid #ee4d40',
      borderRadius: '15px',
      margin: '20px auto', // Center horizontally
    };

    const videoVisible = {
      
      postion:'absolute',
      display: 'flex',
      width: '391.111px',
      height: '220px',
      borderRadius: '15px',
      transition: 'opacity 0.4s ease',
      opacity: 1,
      pointerEvents: 'none',
      margin: '20px auto', // Center horizontally
    };

    const videoHidden = {
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      width: '300px',
      height: '200px',
      borderRadius: '10px',
      opacity: 0,
      pointerEvents: 'none' // Deaktiviert Mausereignisse auf ausgeblendetem Video
    };

    


    const indexOfLastItem = activePage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentSkins = skins.slice(indexOfFirstItem, indexOfLastItem);
  
    let renderResult;
    if (this.state.gameBefore != '') {
      renderResult = this.renderResult();
    }
  
    if (this.state.showUsernamePopup) {
      return (
        <Modal open={true} size="tiny">
        <Modal.Header>Bitte wählen Sie einen Skin und geben Sie Ihren Benutzernamen ein:</Modal.Header>
        <Modal.Content>
          <Grid centered columns={3}>
            <Grid.Row>
              {currentSkins.map((skin, index) => (
                <Grid.Column key={index}>
                  <Card
                    onClick={() => this.handleSkinSelect(skin.url)}
                    style={{
                      cursor: 'pointer',
                      border: selectedSkin === skin.url ? '2px solid green' : 'none',
                      height: '200px', // Feste Höhe für die Karte
                      width: '250px', // Feste Breite für die Karte
                    }}
                  >
                    <div style={{ height: '150px', overflow: 'hidden' }}>
                      <Image src={skin.url} style={{ width: '250px', height: '150px', objectFit: 'cover' }} />
                    </div>
                    <Card.Content>
                      <Card.Header>{skin.name}</Card.Header>
                      <Card.Description>{skin.description}</Card.Description>
                    </Card.Content>
                  </Card>
                </Grid.Column>
              ))}
            </Grid.Row>
          </Grid>
          <Grid centered style={{ marginTop: '20px' }}>
            <Pagination
              totalPages={Math.ceil(skins.length / itemsPerPage)}
              activePage={activePage}
              onPageChange={this.handlePageChange}
              firstItem={null}
              lastItem={null}
              style={{ textAlign: 'center', margin: '0', padding: '0' }} // CSS für die Pagination
            />
          </Grid>
          <Form style={{ marginTop: '30px' }}>
            <Form.Field>
              <Input
                placeholder="Benutzername"
                value={username}
                onChange={(e) => this.setState({ username: e.target.value })}
              />
            </Form.Field>
            <Button primary onClick={this.handleUsernameSubmit}>
              Bestätigen
            </Button>
          </Form>
        </Modal.Content>
      </Modal>
      );
    } else {
      if (this.state.connectionError) {
        return <div>Error: Der Socket.IO-Server konnte nicht erreicht werden.</div>;
      } else {
        return (
          <div>
            <br />
  
            <div style={roundInfoStyle}>
              {roundCount > 0 && (
                <Label style={{backgroundColor: "#2b2b33", color: "#FFFFF0"}}>Round {roundCount} of {maxRounds}</Label>
              )}
            </div>
  
            <Grid centered>
              <Grid.Row>
                <Grid.Column width={8} textAlign="center">
                
                {!isPaused && (
                  <div style={timerBoxStyle}>
                    <svg style={svgStyle} viewBox="0 0 100 100">
                      
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="#ee4d40"
                        strokeWidth="10"
                        strokeLinecap="round"
                        style={circleStyle}
                      ></circle>
                      <text x="50" y="50" style={textStyle}>
                        {countdownPlaying ? remainingTime : 'Paused'}
                      </text>
                    </svg>
                    </div>
                  )}

              <iframe
              id="youtube-video"
              style={this.state.showVideo ? videoVisible : videoHidden}
              src={`${this.state.selectedsong.video}?modestbranding=1&iv_load_policy=3&rel=0`}
              title="YouTube video player"
              frameBorder="0"
              allow="autoplay; encrypted-media;"
              allowFullScreen
            ></iframe>


                </Grid.Column>
              </Grid.Row>
  
              <Grid.Row>
                <Grid.Column width={8}>
                  <Form onSubmit={this.onSubmit}>
                    <Form.Dropdown 
                    
                      as={Dropdown}
                      inverted
                      placeholder="Select Game"
                      fluid
                      selection
                      search
                      icon={{ name: this.state.icon, color: this.state.iconcolor }}
                      options={this.state.dropdownOptions}
                      value={this.state.userGuess} // Bindung des Dropdowns an den Zustand
                      onChange={this.onChangeDropdown}
                      selectOnNavigation={true}
                      style={{ minWidth: '400px', backgroundColor:"#36343B", color:"#FFFFF0", textStyle: {color: "#FFFFF0"}}}
                      textStyle={{color: "#FFFFF0"}}
                      searchInput={{ style: { color: "#FFFFF0" }}}
                      
                    />
                  </Form>
                </Grid.Column>
              </Grid.Row>
  
              <Grid.Row style={{ marginTop: '20px' }}>
              {connectedClients.map((client, index) => (
            <Card.Group centered key={index} style={{ margin: '12px'}}>
              <Card  style={{ width: '250px' , backgroundColor:"#36343B", border: '2.2px solid #ee4d40' , boxShadow: "none"}}>
                <div style={{ height: '250px', overflow: 'hidden', backgroundColor:"#FFFFF0" }}>
                  <Image src={client.skin} style={{ width: '250px', height: '250px', objectFit: 'cover' }} />
                </div>
                <Card.Content>
                  <Card.Header style={{color: "#FFFFF0"}}>{client.username}</Card.Header>
                  <Card.Meta style={{color: "#bfbfbf"}}>Gamer</Card.Meta>
                  <Card.Description>
                    <h2  style={{color: "#FFFFF0"}}>Punkte: {client.points}</h2>
                  </Card.Description>
                </Card.Content>
                {guesses[client.username] && (
                  <Label
                    pointing
                    color={guesses[client.username].isCorrect ? 'green' : 'red'}
                  >
                    {guesses[client.username].guess}
                  </Label>
                )}
              </Card>
            </Card.Group>
          ))}
              </Grid.Row>
  
              {this.state.showStartButton && (
                <Grid.Row>
                  <Form>
                    <Form.Button content="Start" color="green" onClick={this.startGame} style={{backgroundColor: "#ee4d40"}}/>
                  </Form>
                </Grid.Row>
              )}
            </Grid>
  
           
            
        

            <Grid.Row style={{ position: 'fixed', bottom: '0', right: '0', width: '300px', margin: '20px', border: '1.5px solid #0e0e12', borderRadius: '5px', backgroundColor: 'white' }}>
  <div style={{ maxHeight: '150px', overflowY: 'auto', padding: '10px' , backgroundColor:"#36343B", color:"#FFFFF0"}}>
    {this.state.chatMessages.map((msg, index) => (
      <div key={index}><strong>{msg.username}:</strong> {msg.message}</div>
    ))}
    <div ref={(el) => { this.messagesEnd = el; }}></div>
  </div>
  <Form onSubmit={this.handleSendMessage} style={{ display: 'flex', alignItems: 'center', padding: '10px', backgroundColor:"#36343B", color:"#FFFFF0" }}>
    <Input
      placeholder='Nachricht...'
      value={this.state.message}
      onChange={(e) => this.setState({ message: e.target.value })}
      style={{ flex: '1' }}
      
    />
    <Button type='submit' icon>
      <Icon name='send' />
    </Button>
  </Form>
</Grid.Row>
  
            <Modal open={showModal} onClose={() => this.setState({ showModal: false })}>
              <Modal.Header>Spiel beendet</Modal.Header>
              <Modal.Content>
                <p>{winnerInfo}</p>
              </Modal.Content>
              <Modal.Actions>
                <Button onClick={() => this.setState({ showModal: false })}>Schließen</Button>
              </Modal.Actions>
            </Modal>
  
            {renderResult && (
              <div style={resultStyle}>
                {renderResult}
              </div>
            )}
          </div>
        );
      }
    }
  }
  
}
