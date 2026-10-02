import React, { Component } from 'react';
import { Form, Label, Dropdown, Icon, Container, Header, Segment, Message } from 'semantic-ui-react';
import axios from 'axios';

// Extended data for genres and platforms
const genreOptions = [
  { key: 'action', text: 'Action', value: 'Action' },
  { key: 'adventure', text: 'Adventure', value: 'Adventure' },
  { key: 'rpg', text: 'RPG', value: 'RPG' },
  { key: 'shooter', text: 'Shooter', value: 'Shooter' },
  { key: 'puzzle', text: 'Puzzle', value: 'Puzzle' },
  { key: 'strategy', text: 'Strategy', value: 'Strategy' },
  { key: 'simulation', text: 'Simulation', value: 'Simulation' },
  { key: 'sports', text: 'Sports', value: 'Sports' },
  { key: 'racing', text: 'Racing', value: 'Racing' },
  { key: 'metroidvania', text: 'Metroidvania', value: 'Metroidvania' },
  { key: 'platformer', text: 'Platformer', value: 'Platformer' },
  { key: 'fighting', text: 'Fighting', value: 'Fighting' },
  { key: 'pointandclick', text: 'Point and Click', value: 'Point and Click' },
  { key: 'slots', text: 'Slots', value: 'Slots' },
  { key: 'rythm', text: 'Rythm', value: 'rythm' },
  { key: 'horror', text: 'Horror', value: 'horror' },
  { key: 'dramaa', text: 'Drama', value: 'drama' }
  
  // Add more genres as needed
];

const platformOptions = [
  { key: 'pc', text: 'PC', value: 'PC', icon: 'desktop' },
  { key: 'ps1', text: 'PS1', value: 'PS1', icon: 'playstation' },
  { key: 'ps2', text: 'PS2', value: 'PS2', icon: 'playstation' },
  { key: 'ps3', text: 'PS3', value: 'PS3', icon: 'playstation' },
  { key: 'ps4', text: 'PS4', value: 'PS4', icon: 'playstation' },
  { key: 'ps5', text: 'PS5', value: 'PS5', icon: 'playstation' },
  { key: 'psp', text: 'PSP', value: 'PSP', icon: 'playstation' },
  { key: 'xbox', text: 'Xbox', value: 'Xbox', icon: 'xbox' },
  { key: 'xbox-one', text: 'Xbox One', value: 'Xbox One', icon: 'xbox' },
  { key: 'xbox-360', text: 'Xbox 360', value: 'Xbox 360', icon: 'xbox' },
  { key: 'xbox-series-x', text: 'Xbox Series X', value: 'Xbox Series X', icon: 'xbox' },
  { key: 'mobile', text: 'Mobile', value: 'Mobile', icon: 'mobile' },
  // Nintendo consoles
  { key: 'nes', text: 'NES', value: 'NES', icon: 'nintendo switch' },
  { key: 'snes', text: 'SNES', value: 'SNES', icon: 'nintendo switch' },
  { key: 'nintendo-64', text: 'Nintendo 64', value: 'Nintendo 64', icon: 'nintendo switch' },
  { key: 'gamecube', text: 'GameCube', value: 'GameCube', icon: 'nintendo switch' },
  { key: 'wii', text: 'Wii', value: 'Wii', icon: 'nintendo switch' },
  { key: 'wii-u', text: 'Wii U', value: 'Wii U', icon: 'nintendo switch' },
  { key: 'gameboy', text: 'Game Boy', value: 'Game Boy', icon: 'nintendo switch' },
  { key: 'gameboy-color', text: 'Game Boy Color', value: 'Game Boy Color', icon: 'nintendo switch' },
  { key: 'gameboy-advance', text: 'Game Boy Advance', value: 'Game Boy Advance', icon: 'nintendo switch' },
  { key: 'nintendo-ds', text: 'Nintendo DS', value: 'Nintendo DS', icon: 'nintendo switch' },
  { key: 'nintendo-3ds', text: 'Nintendo 3DS', value: 'Nintendo 3DS', icon: 'nintendo switch' },
  { key: 'nintendo-switch', text: 'Nintendo Switch', value: 'Nintendo Switch', icon: 'nintendo switch' },
  { key: 'nintendo-switch2', text: 'Nintendo Switch 2', value: 'Nintendo Switch 2', icon: 'nintendo switch' }
];

export default class ApiForm extends Component {
  constructor(props) {
    super(props);

    this.state = {
      game: '',
      series: '',
      songname: '',
      youtubeUrl: '',
      link: '',
      composers: '',
      platforms: [],
      genres: [],
      publisher: '',
      developer: '',
      loading: false,
      successMessage: '',
      errorMessage: '',
    };

    this.onChangeGame = this.onChangeGame.bind(this);
    this.onChangeSeries = this.onChangeSeries.bind(this);
    this.onChangeSongName = this.onChangeSongName.bind(this);
    this.onChangeYoutubeUrl = this.onChangeYoutubeUrl.bind(this);
    this.onChangeLink = this.onChangeLink.bind(this);
    this.onChangeComposers = this.onChangeComposers.bind(this);
    this.onChangePlatforms = this.onChangePlatforms.bind(this);
    this.onChangeGenres = this.onChangeGenres.bind(this);
    this.onChangePublisher = this.onChangePublisher.bind(this);
    this.onChangeDeveloper = this.onChangeDeveloper.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.extractYoutubeId = this.extractYoutubeId.bind(this);
  }

  onChangeGame(e) {
    this.setState({ game: e.target.value });
  }

  onChangeSeries(e) {
    this.setState({ series: e.target.value });
  }

  onChangeSongName(e) {
    this.setState({ songname: e.target.value });
  }

  onChangeYoutubeUrl(e) {
    const url = e.target.value;
    this.setState({ youtubeUrl: url, link: this.extractYoutubeId(url) });
  }

  onChangeLink(e) {
    this.setState({ link: e.target.value });
  }

  onChangeComposers(e) {
    this.setState({ composers: e.target.value });
  }

  onChangePlatforms(e, { value }) {
    this.setState({ platforms: value });
  }

  onChangeGenres(e, { value }) {
    this.setState({ genres: value });
  }

  onChangePublisher(e) {
    this.setState({ publisher: e.target.value });
  }

  onChangeDeveloper(e) {
    this.setState({ developer: e.target.value });
  }

  extractYoutubeId(url) {
    const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const matches = url.match(regex);
    return matches ? matches[1] : '';
  }

  onSubmit(e) {
    e.preventDefault();

    const { game, series, songname, link, composers, platforms, genres, publisher, developer } = this.state;

    if (!game || !songname || !link || !series) {
      this.setState({ errorMessage: 'Please fill in all required fields' });
      return;
    }

    const musicObject = {
      game,
      series,
      songs: [
        {
          name: songname,
          link,
          composers: composers.split(", "),
          songapproved: false,
        },
      ],
      platforms,
      genres,
      publisher,
      developer,
    };

    this.setState({ loading: true });

    axios.post('https://vmq.onrender.com/addMusic', musicObject)
      .then((res) => {
        console.log(res.data);
        this.setState({
          successMessage: 'Song successfully added!',
          errorMessage: '',
          loading: false,
          game: '',
          series: '',
          songname: '',
          youtubeUrl: '',
          link: '',
          composers: '',
          platforms: [],
          genres: [],
          publisher: '',
          developer: '',
        });
      }).catch((error) => {
        console.log(error);
        this.setState({
          errorMessage: 'An error occurred. Please try again later.',
          successMessage: '',
          loading: false,
        });
      });
  }

  render() {
    const { game, series, songname, youtubeUrl, link, composers, platforms, genres, publisher, developer, loading, successMessage, errorMessage } = this.state;

    return (
      <Container>
        <Segment padded='very'>
          <Header as='h2' textAlign='center' color='teal'>Add New Song</Header>
          <Form onSubmit={this.onSubmit} loading={loading} error={!!errorMessage} success={!!successMessage}>
            <Label style={{ marginBottom: '1em' }}>Game Information</Label>
            <Form.Group widths='equal'>
              <Form.Input
                label='Game'
                placeholder='Game e.g. Mario Kart 8'
                name='game'
                value={game}
                onChange={this.onChangeGame}
                required
              />
              <Form.Input
                label='Gameseries'
                placeholder='Gameseries e.g. Mario Kart'
                name='series'
                value={series}
                onChange={this.onChangeSeries}
                required
              />
            </Form.Group>
            <Label style={{ marginBottom: '1em' }}>Song Information</Label>
            <Form.Group widths='equal'>
              <Form.Input
                label='Songname'
                placeholder='Songname e.g. Main Theme'
                name='songName'
                value={songname}
                onChange={this.onChangeSongName}
                required
              />
              <Form.Input
                label='YouTube URL'
                placeholder='YouTube URL'
                name='youtubeUrl'
                value={youtubeUrl}
                onChange={this.onChangeYoutubeUrl}
              />
              <Form.Input
                label='YouTube ID'
                placeholder='YouTube ID'
                name='link'
                value={link}
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
            <Label style={{ marginBottom: '1em' }}>Game Developer Information</Label>
            <Form.Group widths='equal'>
              <Form.Input
                label='Publisher'
                placeholder='Publisher e.g. Nintendo'
                name='publisher'
                value={publisher}
                onChange={this.onChangePublisher}
              />
              <Form.Input
                label='Developer'
                placeholder='Developer e.g. Level-5'
                name='developer'
                value={developer}
                onChange={this.onChangeDeveloper}
              />
            </Form.Group>
            <Label style={{ marginBottom: '1em' }}>Additional Game Information</Label>
            <Form.Group widths='equal'>
              <Form.Dropdown
                multiple
                selection
                label='Platforms'
                placeholder='Select platforms'
                options={platformOptions}
                onChange={this.onChangePlatforms}
                value={platforms}
              />
              <Form.Dropdown
                multiple
                selection
                label='Genres'
                placeholder='Select genres'
                options={genreOptions}
                onChange={this.onChangeGenres}
                value={genres}
              />
            </Form.Group>
            <Form.Button color='teal'>Submit</Form.Button>
            <Message success header='Success' content={successMessage} />
            <Message error header='Error' content={errorMessage} />
          </Form>
        </Segment>
      </Container>
    );
  }
}
