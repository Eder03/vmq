import React, { Component } from 'react';
import { Form, Label, Grid, Table, Button, Container, Header, Segment, Message, Icon, Input } from 'semantic-ui-react';
import axios from 'axios';
import YouTube from 'react-youtube';

export default class AddSong extends Component {
  constructor(props) {
    super(props);

    this.onChangeSongName = this.onChangeSongName.bind(this);
    this.onChangeLink = this.onChangeLink.bind(this);
    this.onChangeComposers = this.onChangeComposers.bind(this);
    this.onChangeDropdown = this.onChangeDropdown.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.extractYoutubeId = this.extractYoutubeId.bind(this);
    this.playSong = this.playSong.bind(this);
    this.stopSong = this.stopSong.bind(this);
    
    // Bindings für die Bearbeitungs-Funktion
    this.startEdit = this.startEdit.bind(this);
    this.cancelEdit = this.cancelEdit.bind(this);
    this.handleEditChange = this.handleEditChange.bind(this);
    this.saveEdit = this.saveEdit.bind(this);

    this.state = {
      musicData: [],
      dropdownData: [],
      dropdownOptions: [],
      game: '',
      songname: '',
      link: '',
      youtubeId: '',
      composers: '',
      songs: [],
      loading: false,
      successMessage: '',
      errorMessage: '',
      currentPlayingSong: null,
      isPlaying: false,
      
      // States für das Bearbeiten
      editingSongId: null,
      editFormData: {}
    };
  }

  componentDidMount() {
    axios.get('https://vmq.onrender.com/getAll')
      .then(res => {
        const dropdownOptions = res.data.map(game => ({
          key: game.game,
          text: game.game,
          value: game.game,
        }));

        this.setState({ musicData: res.data, dropdownOptions });
      })
      .catch(error => {
        console.log(error);
      });
  }

  extractYoutubeId(url) {
    const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const matches = url.match(regex);
    return matches ? matches[1] : '';
  }

  onChangeSongName(e) {
    this.setState({ songname: e.target.value });
  }

  onChangeLink(e) {
    const url = e.target.value;
    const youtubeId = this.extractYoutubeId(url);
    this.setState({ link: url, youtubeId });
  }

  onChangeComposers(e) {
    this.setState({ composers: e.target.value });
  }

  onChangeDropdown(e, { value }) {
    const game = value;
    const selectedGame = this.state.musicData.find(data => data.game === game);

    if (selectedGame) {
      const newSongs = selectedGame.songs.map((song, index) => ({
        id: index + 1,
        nr: index + 1,
        songname: song.name || '',
        link: song.link || '',
        composers: song.composers ? song.composers.join(', ') : '',
        approved: song.songapproved ? 'true' : 'false',
      }));

      this.setState({ game, songs: newSongs });
    }
  }

  playSong(link) {
    this.setState({ currentPlayingSong: link, isPlaying: true });
  }

  stopSong() {
    this.setState({ currentPlayingSong: null, isPlaying: false });
  }

  startEdit(song) {
    this.setState({ 
      editingSongId: song.id, 
      editFormData: { ...song } 
    });
  }

  cancelEdit() {
    this.setState({ editingSongId: null, editFormData: {} });
  }

  handleEditChange(e, { name, value }) {
    this.setState(prevState => ({
      editFormData: {
        ...prevState.editFormData,
        [name]: value
      }
    }));
  }

  saveEdit(songId) {
    this.setState({ loading: true });
    
    const { editFormData, game, songs } = this.state;
    const oldSong = songs.find(s => s.id === songId);

    let composersArray = [];
    if (editFormData.composers) {
      composersArray = typeof editFormData.composers === 'string' 
        ? editFormData.composers.split(',').map(c => c.trim()) 
        : editFormData.composers;
    }

    const songObject = {
      game: game,
      oldLink: oldSong ? oldSong.link : editFormData.link,
      songs: {
        name: editFormData.songname,
        link: editFormData.link,
        composers: composersArray,
        songapproved: editFormData.approved === 'true' || editFormData.approved === true
      }
    };

    axios.post('https://vmq.onrender.com/editSong', songObject)
      .then(res => {
        const updatedSongs = songs.map(song => 
          song.id === songId ? editFormData : song
        );
        
        this.setState({ 
          songs: updatedSongs, 
          editingSongId: null,
          successMessage: 'Song in der Datenbank erfolgreich aktualisiert!',
          errorMessage: '',
          loading: false
        });
      })
      .catch(error => {
        console.log(error);
        this.setState({
          errorMessage: 'Fehler beim Update des Datenbankeintrags.',
          successMessage: '',
          loading: false
        });
      });
  }

  onSubmit(e) {
    e.preventDefault();
    this.setState({ loading: true });

    const songObject = {
      game: this.state.game,
      songs: {
        name: this.state.songname,
        link: this.state.youtubeId,
        composers: this.state.composers.split(', '),
        songapproved: false,
      },
    };

    axios.post('https://vmq.onrender.com/update', songObject)
      .then(res => {
        console.log(res.data);

        const newSong = {
          id: this.state.songs.length + 1,
          nr: this.state.songs.length + 1,
          songname: this.state.songname,
          link: this.state.youtubeId,
          composers: this.state.composers,
          approved: 'false',
        };

        this.setState(prevState => ({
          successMessage: 'Song successfully added!',
          errorMessage: '',
          loading: false,
          songname: '',
          link: '',
          youtubeId: '',
          composers: '',
          songs: [...prevState.songs, newSong],
        }));
      })
      .catch(error => {
        console.log(error);
        this.setState({
          errorMessage: 'An error occurred. Please try again later.',
          successMessage: '',
          loading: false,
        });
      });
  }

  renderTableData() {
    const { editingSongId, editFormData, currentPlayingSong } = this.state;

    return this.state.songs.map(song => {
      const isEditing = editingSongId === song.id;

      return (
        <Table.Row key={song.id}>
          <Table.Cell>{song.nr}</Table.Cell>
          <Table.Cell>
            {isEditing ? <Input fluid name="songname" value={editFormData.songname} onChange={this.handleEditChange} /> : song.songname}
          </Table.Cell>
          <Table.Cell>
            {isEditing ? <Input fluid name="link" value={editFormData.link} onChange={this.handleEditChange} /> : song.link}
          </Table.Cell>
          <Table.Cell>
            {isEditing ? <Input fluid name="composers" value={editFormData.composers} onChange={this.handleEditChange} /> : song.composers}
          </Table.Cell>
          <Table.Cell>
            {isEditing ? <Input fluid name="approved" value={editFormData.approved} onChange={this.handleEditChange} /> : song.approved}
          </Table.Cell>
          <Table.Cell style={{ minWidth: '130px', textAlign: 'center' }}>
            <Button.Group>
              {isEditing ? (
                <>
                  <Button icon color='green' onClick={() => this.saveEdit(song.id)}>
                    <Icon name='check' />
                  </Button>
                  <Button icon color='red' onClick={this.cancelEdit}>
                    <Icon name='cancel' />
                  </Button>
                </>
              ) : (
                <>
                  <Button icon onClick={() => this.playSong(song.link)} disabled={currentPlayingSong === song.link}>
                    <Icon name='play' />
                  </Button>
                  {currentPlayingSong === song.link && (
                    <Button icon onClick={this.stopSong}>
                      <Icon name='stop' />
                    </Button>
                  )}
                  <Button icon color='blue' onClick={() => this.startEdit(song)}>
                    <Icon name='edit' />
                  </Button>
                </>
              )}
            </Button.Group>
          </Table.Cell>
        </Table.Row>
      );
    });
  }

  render() {
    const { game, songname, link, youtubeId, composers, loading, successMessage, errorMessage, currentPlayingSong, isPlaying } = this.state;

    const videoOptions = {
      height: '0',
      width: '0',
      playerVars: {
        autoplay: 1,
      },
    };

    return (
      <Container>
        <Segment padded='very'>
          <Header as='h2' textAlign='center' color='teal'>Add New Song to Existing Game</Header>
          <Form onSubmit={this.onSubmit} loading={loading} error={!!errorMessage} success={!!successMessage}>
            <Form.Dropdown
              placeholder='Select Game'
              fluid
              selection
              search
              options={this.state.dropdownOptions}
              onChange={this.onChangeDropdown}
              value={game}
              required
            />

            <Label style={{ marginBottom: '10px' }}>Song Information</Label>
            <Form.Group widths='equal'>
              <Form.Input
                label={<label>Songname</label>}
                placeholder='Songname e.g. Main Theme'
                name='songName'
                value={songname}
                onChange={this.onChangeSongName}
                required
              />
              <Form.Input
                label={<label>YouTube URL</label>}
                placeholder='YouTube URL e.g. https://youtu.be/UC_U0l2E-Rs'
                name='link'
                value={link}
                onChange={this.onChangeLink}
              />
              <Form.Input
                label={<label>YouTube ID</label>}
                placeholder='YouTube ID'
                name='youtubeId'
                value={youtubeId}
                readOnly
                required
              />
              <Form.Input
                label='Composers'
                placeholder='Composers e.g. Koji Kondo, Toby Fox'
                name='composers'
                value={composers}
                onChange={this.onChangeComposers}
              />
            </Form.Group>

            <Grid>
              <Grid.Row>
                <Grid.Column>
                  <Form.Button content='Submit' color='green' />
                </Grid.Column>
              </Grid.Row>
            </Grid>
            <Message success header='Success' content={successMessage} />
            <Message error header='Error' content={errorMessage} />
          </Form>

          <div style={{ overflowX: 'auto', marginTop: '2em' }}>
            <Table celled>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Nr</Table.HeaderCell>
                  <Table.HeaderCell>Songname</Table.HeaderCell>
                  <Table.HeaderCell>Link ID</Table.HeaderCell>
                  <Table.HeaderCell>Composers</Table.HeaderCell>
                  <Table.HeaderCell>Approved</Table.HeaderCell>
                  <Table.HeaderCell>Actions</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {this.renderTableData()}
              </Table.Body>
            </Table>
          </div>
          
        </Segment>
        {isPlaying && (
          <YouTube videoId={currentPlayingSong} opts={videoOptions} onEnd={this.stopSong} />
        )}
      </Container>
    );
  }
}