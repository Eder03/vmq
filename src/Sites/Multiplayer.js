import React, { Component } from 'react';
import { Card, Form, Grid, Image, Modal, Button, Label, Input, Segment, Icon, Pagination, Dropdown, Header, List } from 'semantic-ui-react';
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
      guesses: {},
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
      timerFinished: false,
      volume: 10,

      showLobbyModal: false,
      availableLobbies: [],
      newLobbyName: '',
      newLobbyPassword: '',
      newLobbyRounds: 20,
      joinPassword: '',

      // ... in den State einfügen
animatingPlayerIds: [], 
showWinnerPodium: false,
winnersList: [],
previousClients: [],



    };

    //this.socket = io('localhost:5002');
    this.socket = io('https://vmq-server.onrender.com');
    this.startGame = this.startGame.bind(this);

    this.handleUsernameSubmit = this.handleUsernameSubmit.bind(this);
  }

  applyVolumeToIframe = () => {
    const iframe = document.getElementById('youtube-video');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage(JSON.stringify({
        event: 'command',
        func: 'setVolume',
        args: [this.state.volume]
      }), '*');
    }
  }

  handleVolumeChange = (e) => {
    const newVolume = parseInt(e.target.value);
    this.setState({ volume: newVolume }, () => {
      this.applyVolumeToIframe();
    });
  };

  componentDidUpdate(prevProps, prevState) {
    if (prevState.chatMessages.length !== this.state.chatMessages.length) {
        this.scrollToBottom();
    }

    // PUNKTE-ANIMATION LOGIK
    if (prevState.connectedClients !== this.state.connectedClients) {
        const newAnimatingIds = this.state.connectedClients
            .filter(client => {
                const prevClient = prevState.connectedClients.find(c => c.id === client.id);
                return prevClient && client.points > prevClient.points;
            })
            .map(p => p.id);

        if (newAnimatingIds.length > 0) {
            this.setState(state => ({
                animatingPlayerIds: [...state.animatingPlayerIds, ...newAnimatingIds]
            }));

            newAnimatingIds.forEach(id => {
                setTimeout(() => {
                    this.setState(state => ({
                        animatingPlayerIds: state.animatingPlayerIds.filter(itemId => itemId !== id)
                    }));
                }, 1500);
            });
        }
    }

    if (JSON.stringify(prevState.selectedsong) !== JSON.stringify(this.state.selectedsong)) {
        let attempts = 0;
        const volumeRetryInterval = setInterval(() => {
            this.applyVolumeToIframe();
            attempts++;
            if (attempts >= 5) clearInterval(volumeRetryInterval);
        }, 500);
    }
}

  componentDidMount() {

    this.fetchInitialData();
    this.setupSocketListeners();
  }

  componentWillUnmount() {
    clearInterval(this.state.timerInterval);
  }


  fetchInitialData() {
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

  }

  setupSocketListeners() {
    this.socket.on('updatePoints', (clients) => {
      this.setState({ connectedClients: clients });
    });

    this.socket.on('updateClients', (clients) => {
    this.setState({ 
        connectedClients: clients, // Das hier rendert die Karten
        clients: clients.length 
    });
});

    this.socket.on('gameStarted', (selectedSong, maxRounds) => {
      if (Object.keys(this.state.selectedsong).length != 0) {
        this.setState({ gameBefore: this.state.selectedsong.currentGame })
        this.setState({ songBefore: this.state.selectedsong.currentSong.name })
      }

      this.setState({ selectedsong: selectedSong, loadingNextSong: false });
      this.setState({ maxRounds: maxRounds });
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
    const sorted = [...this.state.connectedClients].sort((a, b) => b.points - a.points);
    let currentRank = 1;
    const rankedList = sorted.map((p, i) => {
        if (i > 0 && p.points < sorted[i - 1].points) currentRank = i + 1;
        return { ...p, rank: currentRank };
    });

    this.setState({
        winnersList: rankedList,
        showWinnerPodium: true,
        showVideo: false,
        countdownPlaying: false
    });
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

    // In setupSocketListeners hinzufügen:
this.socket.on('lobbyCreated', ({ roomName }) => {
        this.setState({ 
            showLobbyModal: false, 
            roomName: roomName 
        });
        // Hinweis: Das updateClients kommt separat vom Server und füllt connectedClients
    });

this.socket.on('lobbyList', (lobbies) => {
    this.setState({ availableLobbies: lobbies });
});

this.socket.on('error_message', (msg) => {
    alert(msg); // Einfaches Feedback für den User
});

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

  renderWinnerPodium() {
    const podiumPlayers = this.state.winnersList.filter(p => p.rank <= 3);
    const remainingPlayers = this.state.winnersList.filter(p => p.rank > 3);
    const isHost = this.state.connectedClients.length > 0 && this.state.connectedClients[0].id === this.socket.id;

    return (
        <div className="game-container podium-active" style={{ padding: '20px', textAlign: 'center' }}>
            <Header as="h1" inverted style={{ fontSize: '3.5em', marginBottom: '20px' }}>Endergebnis</Header>
            <div className="podium-container">
                {podiumPlayers.map((player) => {
                    let stepClass = 'step-bronze';
                    if (player.rank === 1) stepClass = 'step-gold';
                    else if (player.rank === 2) stepClass = 'step-silver';

                    return (
                        <div key={player.id} className={`podium-step ${stepClass}`}>
                            {player.rank === 1 && <Icon name="crown" className="winner-crown" />}
                            <Image src={player.skin} className="podium-avatar" style={{ margin: '0 auto' }} />
                            <div className="podium-name">{player.username}</div>
                            <div className="podium-points">{player.points} Pkt.</div>
                            <div className="podium-rank-number">{player.rank}</div>
                        </div>
                    );
                })}
            </div>

            {remainingPlayers.length > 0 && (
                <Segment className="ranking-list-segment" style={{backgroundColor: '#1a1a1d', maxWidth: '600px', margin: '0 auto'}}>
                    <List selection relaxed inverted>
                        {remainingPlayers.map(p => (
                            <List.Item key={p.id} className="ranking-item-compact">
                                <Grid verticalAlign="middle">
                                    <Grid.Column width={2}><strong>{p.rank}.</strong></Grid.Column>
                                    <Grid.Column width={10} textAlign="left">
                                        <Image avatar src={p.skin} /> {p.username}
                                    </Grid.Column>
                                    <Grid.Column width={4} textAlign="right">{p.points} Pkt.</Grid.Column>
                                </Grid>
                            </List.Item>
                        ))}
                    </List>
                </Segment>
            )}

            {/* NEUSTART BUTTON - Nur für den Host sichtbar */}
            {this.state.connectedClients.length > 0 && this.state.connectedClients[0].id === this.socket.id && (
                <div style={{ marginTop: '40px' }}>
                    <Button 
    size="huge" 
    color="green" 
    icon="refresh" 
    content="Zurück zur Lobby" 
    onClick={() => {
        // Wir sagen dem Server: "Setz alles auf Null"
        this.socket.emit('resetGameAndPoints'); 
    }} 
/>
                </div>
            )}
        </div>
    );
}




  startTimerAnimation = () => {
    this.setState({ isPaused: false })
    const { timerStart } = this.state;
    const intervalDuration = 1000 / timerStart;
    this.setState({ showVideo: false })

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
        this.setState({ isPaused: true })

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


    this.setState({ gameBefore: this.state.selectedsong.currentGame })
    this.setState({ songBefore: this.state.selectedsong.currentSong.name })

    // Guesses aktualisieren
    this.updateGuesses(username, userGuess, isCorrect);

    // Informiere den Server über den Guess
    this.socket.emit('userGuess', { username, guess: userGuess, isCorrect });
  };

  sendPoints = () => {
    const points = this.state.points;
    this.socket.emit('sendPoints', { points });
  }


  scrollToBottom = () => {
    this.messagesEnd.scrollIntoView({ behavior: 'smooth' });
  };

  handleUsernameSubmit = () => {

    this.setState({
      showUsernamePopup: false,
      showLobbyModal: true
    });
    this.socket.emit('getLobbies');
  };


  joinLobby = (roomName, providedPassword = null) => {
    const { username, selectedSkin, joinPassword } = this.state;
    const password = providedPassword || joinPassword;

    this.socket.emit('joinLobby', { 
        roomName, 
        password: password, 
        username, 
        skin: selectedSkin 
    });
    
    // UI umschalten: Lobby-Modal schließen, Spiel anzeigen
    this.setState({ 
        showLobbyModal: false, 
        roomName: roomName 
    });
};

  createLobby = () => {
    const { newLobbyName, newLobbyPassword, newLobbyRounds, username, selectedSkin } = this.state;
    
    if(!newLobbyName) return alert("Bitte Lobby-Namen eingeben");

    // UI sofort umschalten (wie bei joinLobby)
    this.setState({ 
        showLobbyModal: false, 
        roomName: newLobbyName 
    });

    // Daten an Server senden
    this.socket.emit('createLobby', { 
        roomName: newLobbyName, 
        password: newLobbyPassword, 
        rounds: newLobbyRounds,
        username: username,    
        skin: selectedSkin     
    });
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
        showWinnerPodium: false, // WICHTIG: Schließt das Podium bei jedem
        winnersList: [],
        roundCount: 0,
        points: 0,
        userGuess: '',
        guesses: {},
        showVideo: false,
        showStartButton: true, // Zeigt dem Host wieder den "Start Game" Button
        countdownPlaying: false,
        isPaused: false,
        circleProgress: 0,
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
        <Segment compact style={{ backgroundColor: "#36343B", color: "#FFFFF0" }}>
          <Label style={{ backgroundColor: "#2b2b33", color: "#FFFFF0" }}>Last game info</Label>
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

    
  const {showWinnerPodium, animatingPlayerIds, username, activePage, itemsPerPage, skins, selectedSkin, message, chatMessages, winners, winnerInfo, guesses, clients, points, countdownPlaying, remainingTime, loadingNextSong, selectedsong, connectedClients, showModal, winnerUsernames, winnerPoints, circleProgress, isPaused, roundCount, maxRounds, showLobbyModal, showUsernamePopup, availableLobbies } = this.state;
  console.log("RENDER - Clients:", connectedClients, "LobbyModal:", showLobbyModal);

  const isHost = connectedClients.length > 0 && connectedClients[0].id === this.socket.id;

  const circleStyle = {
    transition: 'stroke-dashoffset 1s ease-in-out',
    strokeDasharray: `${2 * Math.PI * 45}`,
    strokeDashoffset: circleProgress,
    transform: 'rotate(-90deg)',
    transformOrigin: 'center',
  };

  const indexOfLastItem = activePage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSkins = skins.slice(indexOfFirstItem, indexOfLastItem);

  let renderResultElement = this.state.gameBefore !== '' ? this.renderResult() : null;

  // PHASE 1: Username & Skin Auswahl
  if (showWinnerPodium) return this.renderWinnerPodium();
  if (showUsernamePopup) {
    return (
      <Modal open={true} size="tiny">
        <Modal.Header>Bitte wählen Sie einen Skin und Benutzernamen:</Modal.Header>
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
                      height: '200px',
                      width: '250px',
                    }}
                  >
                    <div style={{ height: '150px', overflow: 'hidden' }}>
                      <Image src={skin.url} style={{ width: '250px', height: '150px', objectFit: 'cover' }} />
                    </div>
                    <Card.Content>
                      <Card.Header>{skin.name}</Card.Header>
                    </Card.Content>
                  </Card>
                </Grid.Column>
              ))}
            </Grid.Row>
          </Grid>
          <Grid centered style={{ marginTop: '20px' }}>
            <Pagination totalPages={Math.ceil(skins.length / itemsPerPage)} activePage={activePage} onPageChange={this.handlePageChange} />
          </Grid>
          <Form style={{ marginTop: '30px' }}>
            <Input placeholder="Benutzername" value={username} onChange={(e) => this.setState({ username: e.target.value })} fluid />
            <Button primary onClick={this.handleUsernameSubmit} style={{ marginTop: '10px' }}>Bestätigen</Button>
          </Form>
        </Modal.Content>
      </Modal>
    );
  }

  // PHASE 2: Lobby Auswahl / Erstellen
  if (showLobbyModal) {
    return (
      <Modal open={true} size="large">
        <Button onClick={() => console.log("Aktueller State:", this.state)}>Debug State</Button>
        <Modal.Header>Lobby-Auswahl</Modal.Header>
        <Modal.Content scrolling>
          <Grid columns={2} divided stackable>
            <Grid.Column>
              <h3>Lobby erstellen</h3>
              <Form>
                <Form.Input label="Lobby Name" placeholder="Cool Room" onChange={e => this.setState({ newLobbyName: e.target.value })} />
                <Form.Input label="Passwort (optional)" type="password" onChange={e => this.setState({ newLobbyPassword: e.target.value })} />
                <Form.Input label="Runden" type="number" defaultValue={20} onChange={e => this.setState({ newLobbyRounds: e.target.value })} />
                <Button color="green" onClick={this.createLobby} fluid>Erstellen & Beitreten</Button>
              </Form>
            </Grid.Column>
            <Grid.Column>
              <h3>Verfügbare Lobbys</h3>
              {availableLobbies.length === 0 ? <p>Keine Lobbys verfügbar.</p> : 
                availableLobbies.map(lobby => (
                <Segment key={lobby.name} clearing>
                  <strong>{lobby.name}</strong> ({lobby.playerCount} Spieler)
                  {lobby.hasPassword && <Icon name="lock" style={{ marginLeft: '5px' }} />}
                  <Button floated="right" primary onClick={() => this.joinLobby(lobby.name)}>Beitreten</Button>
                  {lobby.hasPassword && (
                    <Input size="mini" floated="right" placeholder="PW" type="password" onChange={e => this.setState({ joinPassword: e.target.value })} style={{width: '80px', marginRight: '5px'}}/>
                  )}
                </Segment>
              ))}
            </Grid.Column>
          </Grid>
        </Modal.Content>
      </Modal>
    );
  }

  // PHASE 3: Das eigentliche Spiel
  return (
    <div className="game-container">
      <div className="round-info-container">
        {roundCount > 0 && <Label style={{ backgroundColor: "#2b2b33", color: "#FFFFF0" }}>Round {roundCount} of {maxRounds}</Label>}
      </div>

      <div className="volume-control-container">
        <Icon name={this.state.volume === 0 ? 'volume off' : 'volume up'} style={{ color: '#FFFFF0', marginRight: '8px' }} />
        <input type="range" min="0" max="100" className="volume-slider" value={this.state.volume} onChange={this.handleVolumeChange} />
        <span className="volume-text">{this.state.volume}%</span>
      </div>

      <Grid centered>
        <Grid.Row>
          <Grid.Column width={8} textAlign="center">
            {!isPaused && (
              <div className="timer-box">
                <svg viewBox="0 0 100 100" className='circle-svg'>
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#ee4d40" strokeWidth="10" strokeLinecap="round" style={circleStyle}></circle>
                  <text x="50" y="50" className="timer-text">{countdownPlaying ? remainingTime : 'Paused'}</text>
                </svg>
              </div>
            )}
            <iframe
              id="youtube-video"
              className={this.state.showVideo ? "video-frame-visible" : "video-frame-hidden"}
              src={`${selectedsong.video}${selectedsong.video?.includes('?') ? '&' : '?'}enablejsapi=1&version=3`}
              frameBorder="0" allow="autoplay; encrypted-media;"
            ></iframe>
          </Grid.Column>
        </Grid.Row>

        <Grid.Row>
          <Grid.Column width={8}>
            <Dropdown
              placeholder="Select Game" fluid selection search inverted
              options={this.state.dropdownOptions}
              value={this.state.userGuess}
              onChange={this.onChangeDropdown}
              className="guess-dropdown"
              style={{ backgroundColor: "#36343B", color: "#FFFFF0" }}
            />
          </Grid.Column>
        </Grid.Row>

        <Grid.Row style={{ marginTop: '20px' }}>
          {connectedClients.map((client, index) => {
            const isAnimating = animatingPlayerIds.includes(client.id);
            return (

            <Card key={index} className="player-card-container" style={{ width: '250px', backgroundColor: "#36343B", border: '2.2px solid #ee4d40', margin: '12px', boxShadow: "none" }}>
              {isAnimating && (
                <div key={`anim-${client.id}-${client.points}`} className="points-animation">+1</div>
            )}
              <div style={{ height: '250px', overflow: 'hidden', backgroundColor: "#FFFFF0" }}>
                <Image src={client.skin} style={{ width: '250px', height: '250px', objectFit: 'cover' }} />
              </div>
              <Card.Content>
                <Card.Header style={{ color: "#FFFFF0" }}>{client.username}</Card.Header>
                <Card.Description><h2 style={{ color: "#FFFFF0" }}>Punkte: {client.points}</h2></Card.Description>
              </Card.Content>
              {guesses[client.username] && (
                <Label pointing color={guesses[client.username].isCorrect ? 'green' : 'red'}>
                  {guesses[client.username].guess}
                </Label>
              )}
            </Card>
  )})}
        </Grid.Row>

        {this.state.showStartButton && isHost &&(
          <Grid.Row>
            <Button content="Start Game" color="green" onClick={this.startGame} style={{ backgroundColor: "#ee4d40" }} />
          </Grid.Row>
        )}
      </Grid>

      <Grid.Row className="chat-window">
        <div className="chat-messages-container">
          {chatMessages.map((msg, index) => (
            <div key={index}><strong>{msg.username}:</strong> {msg.message}</div>
          ))}
          <div ref={(el) => { this.messagesEnd = el; }}></div>
        </div>
        <Form onSubmit={this.handleSendMessage} style={{ display: 'flex', padding: '10px', backgroundColor: "#36343B" }}>
          <Input placeholder='Nachricht...' value={message} onChange={(e) => this.setState({ message: e.target.value })} style={{ flex: '1' }} />
          <Button type='submit' icon><Icon name='send' /></Button>
        </Form>
      </Grid.Row>

      <Modal open={showModal} onClose={() => this.setState({ showModal: false })}>
        <Modal.Header>Spiel beendet</Modal.Header>
        <Modal.Content><p>{winnerInfo}</p></Modal.Content>
        <Modal.Actions><Button onClick={() => this.setState({ showModal: false })}>Schließen</Button></Modal.Actions>
      </Modal>

      {renderResultElement && <div className="result-modal">{renderResultElement}</div>}
    </div>
  );
}

}