import React, { Component, SyntheticEvent, ChangeEvent } from 'react';
import { Form, Label, Grid, Table, Button, Container, Header, Segment, Message, Input, Dropdown, DropdownProps } from 'semantic-ui-react';
import axios from 'axios';
import YouTube from 'react-youtube';
import { Play, Tv, Check, X, Pencil } from 'lucide-react';

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
  { key: 'drama', text: 'Drama', value: 'drama' }
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

interface Song {
  id: number;
  nr: number;
  game?: string;
  series?: string;
  songname: string;
  link: string;
  composers: string | string[];
  publisher?: string;
  developer?: string;
  platforms?: string | string[];
  genres?: string | string[];
  approved: string | boolean;
}

interface AddSongState {
  musicData: any[];
  dropdownOptions: any[];
  game: string;
  songname: string;
  link: string;
  youtubeId: string;
  composers: string;
  songs: Song[];
  loading: boolean;
  successMessage: string;
  errorMessage: string;
  currentPlayingSong: string | null;
  isPlaying: boolean;
  editingSongId: number | null;
  editFormData: Partial<Song>;
  gameData: any;
  isEditingGame: boolean;
  editGameFormData: any;
}

export default class AddSongNew extends Component<{}, AddSongState> {
  constructor(props: {}) {
    super(props);

    this.onChangeSongName = this.onChangeSongName.bind(this);
    this.onChangeLink = this.onChangeLink.bind(this);
    this.onChangeComposers = this.onChangeComposers.bind(this);
    this.onChangeDropdown = this.onChangeDropdown.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.extractYoutubeId = this.extractYoutubeId.bind(this);
    this.playSong = this.playSong.bind(this);
    this.stopSong = this.stopSong.bind(this);
    
    // Bindings für die Song-Bearbeitung
    this.startEdit = this.startEdit.bind(this);
    this.cancelEdit = this.cancelEdit.bind(this);
    this.handleEditChange = this.handleEditChange.bind(this);
    this.saveEdit = this.saveEdit.bind(this);

    // Bindings für die Game-Bearbeitung
    this.startGameEdit = this.startGameEdit.bind(this);
    this.cancelGameEdit = this.cancelGameEdit.bind(this);
    this.handleGameEditChange = this.handleGameEditChange.bind(this);
    this.saveGameEdit = this.saveGameEdit.bind(this);

    this.state = {
      musicData: [],
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
      
      editingSongId: null,
      editFormData: {},

      gameData: null,
      isEditingGame: false,
      editGameFormData: {}
    };
  }

  componentDidMount() {
    axios.get('https://vmq.onrender.com/getAll')
      .then(res => {
        const dropdownOptions = res.data.map((game: any) => ({
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

  extractYoutubeId(url: string) {
    const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const matches = url.match(regex);
    return matches ? matches[1] : '';
  }

  onChangeSongName(e: ChangeEvent<HTMLInputElement>) {
    this.setState({ songname: e.target.value });
  }

  onChangeLink(e: ChangeEvent<HTMLInputElement>) {
    const url = e.target.value;
    const youtubeId = this.extractYoutubeId(url);
    this.setState({ link: url, youtubeId });
  }

  onChangeComposers(e: ChangeEvent<HTMLInputElement>) {
    this.setState({ composers: e.target.value });
  }

  onChangeDropdown(e: SyntheticEvent, { value }: DropdownProps) {
    const game = value as string;
    const selectedGame = this.state.musicData.find(data => data.game === game);

    if (selectedGame) {
      const newSongs = selectedGame.songs.map((song: any, index: number) => ({
        id: index + 1,
        nr: index + 1,
        songname: song.name || '',
        link: song.link || '',
        composers: Array.isArray(song.composers) ? song.composers.join(', ') : (song.composers || ''),
        approved: song.songapproved ? 'true' : 'false',
      }));

      this.setState({ 
        game, 
        songs: newSongs,
        gameData: {
          game: selectedGame.game || '',
          series: selectedGame.series || '',
          publisher: selectedGame.publisher || '',
          developer: selectedGame.developer || '',
          platforms: selectedGame.platforms || [],
          genres: selectedGame.genres || []
        }
      });
    }
  }

  playSong(link: string) {
    this.setState({ currentPlayingSong: link, isPlaying: true });
  }

  stopSong() {
    this.setState({ currentPlayingSong: null, isPlaying: false });
  }

  // --- Game-Bearbeitungs-Methoden ---
  startGameEdit() {
    this.setState({ 
      isEditingGame: true, 
      editGameFormData: { ...this.state.gameData } 
    });
  }

  cancelGameEdit() {
    this.setState({ isEditingGame: false, editGameFormData: {} });
  }

  handleGameEditChange(e: SyntheticEvent, { name, value }: any) {
    this.setState(prevState => ({
      editGameFormData: {
        ...prevState.editGameFormData,
        [name]: value
      }
    }));
  }

  saveGameEdit() {
    this.setState({ loading: true });
    
    const { editGameFormData, gameData } = this.state;

    const platformsArray = Array.isArray(editGameFormData.platforms)
      ? editGameFormData.platforms
      : typeof editGameFormData.platforms === 'string'
        ? editGameFormData.platforms.split(',').map((s: string) => s.trim()).filter(Boolean)
        : [];
        
    const genresArray = Array.isArray(editGameFormData.genres)
      ? editGameFormData.genres
      : typeof editGameFormData.genres === 'string'
        ? editGameFormData.genres.split(',').map((s: string) => s.trim()).filter(Boolean)
        : [];

    const payload = {
      oldGame: gameData.game, 
      newGameData: {
        game: editGameFormData.game,
        series: editGameFormData.series,
        publisher: editGameFormData.publisher,
        developer: editGameFormData.developer,
        platforms: platformsArray,
        genres: genresArray
      }
    };

    axios.post('https://vmq.onrender.com/editGameInfo', payload)
      .then(res => {
        const newGameName = editGameFormData.game;
        
        this.setState(prevState => {
          const updatedOptions = prevState.dropdownOptions.map(opt => 
             opt.value === gameData.game ? { ...opt, text: newGameName, value: newGameName, key: newGameName } : opt
          );

          return {
            gameData: editGameFormData,
            game: newGameName,
            dropdownOptions: updatedOptions,
            isEditingGame: false,
            successMessage: 'Game Info in der Datenbank erfolgreich aktualisiert!',
            errorMessage: '',
            loading: false
          };
        });
      })
      .catch(error => {
        console.log(error);
        this.setState({
          errorMessage: 'Fehler beim Update der Game Info.',
          successMessage: '',
          loading: false
        });
      });
  }

  // --- Song-Bearbeitungs-Methoden ---
  startEdit(song: Song) {
    this.setState({ 
      editingSongId: song.id, 
      editFormData: { ...song } 
    });
  }

  cancelEdit() {
    this.setState({ editingSongId: null, editFormData: {} });
  }

  handleEditChange(e: SyntheticEvent, { name, value }: any) {
    this.setState(prevState => ({
      editFormData: {
        ...prevState.editFormData,
        [name]: value
      }
    }));
  }

  saveEdit(songId: number) {
    this.setState({ loading: true });
    
    const { editFormData, game, songs } = this.state;
    const oldSong = songs.find(s => s.id === songId);

    let composersArray: string[] = [];
    if (editFormData.composers) {
      composersArray = typeof editFormData.composers === 'string' 
        ? editFormData.composers.split(',').map(c => c.trim()) 
        : (editFormData.composers as string[]);
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
          song.id === songId ? { ...song, ...editFormData } as Song : song
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

  onSubmit(e: SyntheticEvent) {
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

        const newSong: Song = {
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

renderGameTable() {
    if (!this.state.gameData || !this.state.gameData.game) return null;
    
    const { isEditingGame, editGameFormData, gameData } = this.state;
    const data = isEditingGame ? editGameFormData : gameData;

    return (
      <div style={{ overflowX: 'auto', marginBottom: '2em', marginTop: '2em', paddingBottom: isEditingGame ? '15em' : '0' }}>
        <Header as='h3' style={{ color: '#f26419', textShadow: '0 0 10px rgba(242, 100, 25, 0.5)' }}>Game Information</Header>
        <Table celled unstackable className="custom-dark-table">
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell style={{ minWidth: '150px' }}>Game</Table.HeaderCell>
              <Table.HeaderCell style={{ minWidth: '150px' }}>Series</Table.HeaderCell>
              <Table.HeaderCell style={{ minWidth: '130px' }}>Publisher</Table.HeaderCell>
              <Table.HeaderCell style={{ minWidth: '130px' }}>Developer</Table.HeaderCell>
              <Table.HeaderCell style={{ minWidth: '250px' }}>Platforms</Table.HeaderCell>
              <Table.HeaderCell style={{ minWidth: '220px' }}>Genres</Table.HeaderCell>
              <Table.HeaderCell style={{ width: '110px', textAlign: 'center' }}>Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            <Table.Row>
              <Table.Cell>
                {isEditingGame ? <Input fluid name="game" value={data.game} onChange={this.handleGameEditChange} /> : data.game}
              </Table.Cell>
              <Table.Cell>
                {isEditingGame ? <Input fluid name="series" value={data.series} onChange={this.handleGameEditChange} /> : data.series}
              </Table.Cell>
              <Table.Cell>
                {isEditingGame ? <Input fluid name="publisher" value={data.publisher} onChange={this.handleGameEditChange} /> : data.publisher}
              </Table.Cell>
              <Table.Cell>
                {isEditingGame ? <Input fluid name="developer" value={data.developer} onChange={this.handleGameEditChange} /> : data.developer}
              </Table.Cell>
              <Table.Cell style={{ overflow: 'visible' }}>
                {isEditingGame ? (
                  <Dropdown
                    name="platforms"
                    multiple
                    selection
                    search
                    options={platformOptions}
                    value={Array.isArray(data.platforms) ? data.platforms : typeof data.platforms === 'string' ? data.platforms.split(',').map((s: string) => s.trim()).filter(Boolean) : []}
                    onChange={this.handleGameEditChange}
                    fluid
                  />
                ) : (
                  Array.isArray(data.platforms) ? data.platforms.join(', ') : data.platforms
                )}
              </Table.Cell>
              <Table.Cell style={{ overflow: 'visible' }}>
                {isEditingGame ? (
                  <Dropdown
                    name="genres"
                    multiple
                    selection
                    search
                    options={genreOptions}
                    value={Array.isArray(data.genres) ? data.genres : typeof data.genres === 'string' ? data.genres.split(',').map((s: string) => s.trim()).filter(Boolean) : []}
                    onChange={this.handleGameEditChange}
                    fluid
                  />
                ) : (
                  Array.isArray(data.genres) ? data.genres.join(', ') : data.genres
                )}
              </Table.Cell>
              <Table.Cell style={{ textAlign: 'center' }}>
                {isEditingGame ? (
                  <Button.Group>
                    <Button color='green' onClick={this.saveGameEdit}>
                      <Check size={16} />
                    </Button>
                    <Button color='red' onClick={this.cancelGameEdit}>
                      <X size={16} />
                    </Button>
                  </Button.Group>
                ) : (
                  <Button color='blue' onClick={this.startGameEdit}>
                    <Pencil size={16} />
                  </Button>
                )}
              </Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>
      </div>
    );
  }

  renderTableData() {
    const { editingSongId, editFormData, currentPlayingSong } = this.state;

    return this.state.songs.map((song: Song) => {
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
            {isEditing ? <Input fluid name="approved" value={String(editFormData.approved ?? false)} onChange={this.handleEditChange} /> : (song.approved ? song.approved.toString() : 'false')}
          </Table.Cell>
          <Table.Cell style={{ minWidth: '130px', textAlign: 'center' }}>
            <Button.Group>
              {isEditing ? (
                <>
                  <Button color='green' onClick={() => this.saveEdit(song.id)}>
                    <Check size={16} />
                  </Button>
                  <Button color='red' onClick={this.cancelEdit}>
                    <X size={16} />
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={() => this.playSong(song.link)} disabled={currentPlayingSong === song.link} style={{ backgroundColor: currentPlayingSong === song.link ? '#3a1228' : '#d92534', color: 'white' }}>
                    <Play size={16} />
                  </Button>
                  {currentPlayingSong === song.link && (
                    <Button color='orange' onClick={this.stopSong}>
                      <Tv size={16} />
                    </Button>
                  )}
                  <Button color='blue' onClick={() => this.startEdit(song)}>
                    <Pencil size={16} />
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

    // Midnight Ablaze Pop Culture CSS
    // Midnight Ablaze Pop Culture CSS
    // Midnight Ablaze Pop Culture CSS
    const customStyles = `
      @keyframes floatSlow {
        0% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(-20px) rotate(5deg); }
        100% { transform: translateY(0px) rotate(0deg); }
      }
      @keyframes floatFast {
        0% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(-30px) rotate(-10deg); }
        100% { transform: translateY(0px) rotate(0deg); }
      }
      .synth-wrapper {
        min-height: 100vh;
        background: linear-gradient(135deg, #080812 0%, #1a1025 100%);
        padding: 3rem 0;
        position: relative;
        overflow: hidden;
      }
      .synth-wrapper .glass-segment {
        background: rgba(26, 16, 37, 0.7) !important;
        backdrop-filter: blur(16px);
        border: 1px solid rgba(242, 100, 25, 0.3) !important;
        box-shadow: 0 0 25px rgba(217, 37, 52, 0.15) !important;
        border-radius: 1.5rem !important;
      }
      .synth-wrapper .glass-segment * {
        color: #fdf0d5;
      }
      .synth-wrapper .synth-header {
        color: #f6aa1c !important;
        text-shadow: 0 0 15px rgba(242, 100, 25, 0.6);
        font-weight: 800 !important;
        letter-spacing: 1px;
      }
      .synth-wrapper .custom-dark-table {
        background: rgba(8, 8, 18, 0.8) !important; 
        color: #fdf0d5 !important; 
        border: 1px solid rgba(242, 100, 25, 0.3) !important; 
      }
      .synth-wrapper .custom-dark-table thead th { 
        background: rgba(26, 16, 37, 0.9) !important; 
        color: #f26419 !important; 
        border-bottom: 2px solid #d92534 !important;
      }
      .synth-wrapper .custom-dark-table td {
        border-top: 1px solid rgba(253, 240, 213, 0.05) !important;
      }
      
      .synth-wrapper .ui.input input, .ui.selection.dropdown { 
        background: rgba(8, 8, 18, 0.9) !important; 
        color: #fdf0d5 !important; 
        border: 1px solid rgba(242, 100, 25, 0.5) !important; 
      }
      .synth-wrapper .ui.selection.dropdown:focus, .ui.selection.dropdown:hover {
        border-color: #f6aa1c !important;
        background: rgba(26, 16, 37, 0.95) !important;
        box-shadow: 0 0 8px rgba(246, 170, 28, 0.3) !important;
      }
      
      /* EXPLIZITER FIX FÜR DEN GRAUEN HINTERGRUND (Erzwingt Hintergrundfarbe auf allen Dropdown-Layern) */
      .synth-wrapper div.ui.dropdown .menu,
      .synth-wrapper div.ui.selection.dropdown .menu,
      .synth-wrapper div.ui.multiple.search.dropdown .menu,
      .synth-wrapper div.ui.active.visible.dropdown .menu.transition.visible { 
        background-color: #1f0510 !important;
        background: #1f0510 !important;
        border: 1px solid rgba(242, 100, 25, 0.6) !important;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.8) !important;
      }
      
      .synth-wrapper div.ui.dropdown .menu > .item,
      .synth-wrapper div.ui.selection.dropdown .menu > .item,
      .synth-wrapper div.ui.multiple.search.dropdown .menu > .item { 
        background-color: rgba(26, 16, 37, 0.7) !important;
        background: rgba(26, 16, 37, 0.7) !important;
        color: #fdf0d5 !important; 
        border-top: 1px solid rgba(253, 240, 213, 0.05) !important;
      }
      
      .synth-wrapper div.ui.dropdown .menu > .item:hover, 
      .synth-wrapper div.ui.selection.dropdown .menu > .item.selected,
      .synth-wrapper div.ui.selection.dropdown .menu > .item.active { 
        background-color: rgba(217, 37, 52, 0.9) !important; 
        background: rgba(217, 37, 52, 0.9) !important;
        color: #ffffff !important; 
      }
      
      .synth-wrapper .ui.multiple.dropdown > .label {
        background: #f6aa1c !important; 
        color: #080812 !important;
        font-weight: bold;
        border: 1px solid #f26419 !important;
        box-shadow: 0 0 5px rgba(246, 170, 28, 0.4) !important;
      }
      .synth-wrapper .ui.multiple.dropdown > .label:hover {
        background: #f26419 !important; 
      }
      .synth-wrapper .ui.multiple.dropdown > .label > .delete.icon {
        color: #080812 !important;
        opacity: 0.7;
      }
      .synth-wrapper .ui.multiple.dropdown > .label > .delete.icon:hover {
        color: #d92534 !important;
        opacity: 1;
      }
      
      .synth-wrapper .ui.selection.dropdown > .text, 
      .synth-wrapper .ui.selection.dropdown > .search.icon, 
      .synth-wrapper .ui.selection.dropdown > .dropdown.icon {
        color: #fdf0d5 !important;
      }
     .synth-wrapper .ui.selection.dropdown input.search {
        color: #fdf0d5 !important;
      }
      .synth-wrapper .ui.selection.dropdown .default.text {
        color: rgba(253, 213, 213, 0.4) !important;
      }
      
      .synth-wrapper .ui.label { 
        background: transparent !important; 
        color: #f26419 !important; 
        font-size: 1.1em !important; 
        font-weight: bold; 
      }
      
      ::-webkit-scrollbar { width: 10px; height: 10px; }
      ::-webkit-scrollbar-track { background: #080812; border-radius: 5px; }
      ::-webkit-scrollbar-thumb { background: #d92534; border-radius: 5px; border: 2px solid #080812; }
      ::-webkit-scrollbar-thumb:hover { background: #f26419; }
    `;

    return (
      <div className="synth-wrapper">
        <style>{customStyles}</style>

        {/* Pop Culture Floating Background Elements */}
        

        <div style={{ position: 'absolute', bottom: '5%', left: '15%', opacity: 0.3, animation: 'floatSlow 7s infinite ease-in-out', zIndex: 0 }}>
          <img src="https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/64c0d4d3-8ff2-4241-ad72-1a133586ab29/de9n2j4-44f32386-9814-4477-a178-c334ccfc5eca.png/v1/fit/w_828,h_1056/builder_mario_super_mario_maker_2_smm2__by_supermarioallstar_de9n2j4-414w-2x.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MTUzMCIsInBhdGgiOiIvZi82NGMwZDRkMy04ZmYyLTQyNDEtYWQ3Mi0xYTEzMzU4NmFiMjkvZGU5bjJqNC00NGYzMjM4Ni05ODE0LTQ0NzctYTE3OC1jMzM0Y2NmYzVlY2EucG5nIiwid2lkdGgiOiI8PTEyMDAifV1dLCJhdWQiOlsidXJuOnNlcnZpY2U6aW1hZ2Uub3BlcmF0aW9ucyJdfQ.TQHP-wVloLuGWOl_Z0qAFH5NCjaJYro_dha0MgFWmww" alt="Builder Mario" style={{ height: '300px' }} />
        </div>
        <div style={{ position: 'absolute', bottom: '0%', right: '8%', opacity: 0.3, animation: 'floatFast 5s infinite ease-in-out', zIndex: 0 }}>
          <img src="https://github.com/Eder03/vmq_skins/blob/main/naur/goro.png?raw=true" alt="Goro Akechi" style={{ height: '250px' }} />
        </div>
        
        <Container style={{ width: '95%', maxWidth: '1600px', position: 'relative', zIndex: 10 }}>
          <Segment padded='very' className="glass-segment">
            <Header as='h1' textAlign='center' className="synth-header" style={{ marginBottom: '2rem' }}>
              Add/Edit Songs & Game Info
            </Header>
            
            <Form onSubmit={this.onSubmit} loading={loading} error={!!errorMessage} success={!!successMessage}>
              <Form.Dropdown
                placeholder='Select Game to Edit / Add Song'
                fluid
                selection
                search
                options={this.state.dropdownOptions}
                onChange={this.onChangeDropdown}
                value={game}
                required
              />

              <Label style={{ marginBottom: '10px', marginTop: '20px', color: '#f26419' }}>Add New Song Information</Label>
              <Form.Group widths='equal'>
                <Form.Input
                  label={<label style={{color: '#fdf0d5'}}>Songname</label>}
                  placeholder='Songname e.g. Main Theme'
                  name='songName'
                  value={songname}
                  onChange={this.onChangeSongName}
                  required
                />
                <Form.Input
                  label={<label style={{color: '#fdf0d5'}}>YouTube URL</label>}
                  placeholder='YouTube URL e.g. https://youtu.be/UC_U0l2E-Rs'
                  name='link'
                  value={link}
                  onChange={this.onChangeLink}
                />
                <Form.Input
                  label={<label style={{color: '#fdf0d5'}}>YouTube ID</label>}
                  placeholder='YouTube ID'
                  name='youtubeId'
                  value={youtubeId}
                  readOnly
                  required
                />
                <Form.Input
                  label={<label style={{color: '#fdf0d5'}}>Composers</label>}
                  placeholder='Composers e.g. Koji Kondo, Toby Fox'
                  name='composers'
                  value={composers}
                  onChange={this.onChangeComposers}
                />
              </Form.Group>

              <Grid>
                <Grid.Row>
                  <Grid.Column>
                    <Button type='submit' style={{ background: 'linear-gradient(to right, #d92534, #f26419)', color: '#fdf0d5', fontWeight: 'bold' }}>
                      <Check size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} />
                      Submit New Song
                    </Button>
                  </Grid.Column>
                </Grid.Row>
              </Grid>
              <Message success header='Success' content={successMessage} style={{ background: 'rgba(246, 170, 28, 0.15)', color: '#f6aa1c', border: '1px solid #f6aa1c' }} />
              <Message error header='Error' content={errorMessage} style={{ background: 'rgba(217, 37, 52, 0.15)', color: '#ffb3b8', border: '1px solid #d92534' }} />
            </Form>

            {this.renderGameTable()}

            <div style={{ overflowX: 'auto', marginTop: '3em' }}>
              <Header as='h3' style={{ color: '#f26419', textShadow: '0 0 10px rgba(242, 100, 25, 0.5)' }}>Songs in Database</Header>
              <Table celled unstackable className="custom-dark-table" style={{ minWidth: '1000px' }}>
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell style={{ width: '60px' }}>Nr</Table.HeaderCell>
                    <Table.HeaderCell style={{ minWidth: '200px' }}>Songname</Table.HeaderCell>
                    <Table.HeaderCell style={{ minWidth: '150px' }}>Link ID</Table.HeaderCell>
                    <Table.HeaderCell style={{ minWidth: '200px' }}>Composers</Table.HeaderCell>
                    <Table.HeaderCell style={{ minWidth: '100px' }}>Approved</Table.HeaderCell>
                    <Table.HeaderCell style={{ width: '150px', textAlign: 'center' }}>Actions</Table.HeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {this.renderTableData()}
                </Table.Body>
              </Table>
            </div>
            
          </Segment>
          {isPlaying && (
            <YouTube 
              videoId={currentPlayingSong || undefined} 
              opts={videoOptions as any} 
              onEnd={this.stopSong} 
            />
          )}
        </Container>
      </div>
    );
  }
}