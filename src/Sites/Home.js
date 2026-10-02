import React, { Component } from 'react'
import { Segment, Form, GridRow, Label, Grid, Icon, Input, Message, Header, Button, Visibility, Image, GridColumn } from 'semantic-ui-react'
import { Link } from 'react-router-dom'



export default class ApiForm extends Component {
  constructor(props) {
      super(props)

      //Deklaration der einzelnen Datenbank Variablen
      this.state = {
      }
  }
  
  //Standard Funktion; wird aufgerufen bevor/während die Seite geladen wird
  componentDidMount(){
  }

  //Standard Funktion; wird aufgerufen nachdem die Seite geschlosse wird
  componentWillUnmount(){
  }


  render() {
      return (
        
        <div>
          {/* Abstand zu Navbar */}
          <br></br>


          <Image centered src='./DAS_IST_DAS_BESTE_DAS_MEINE_AUGEN_JE_GESEHEN_HABEN.png' size='big'/>
          <hr color='#2d394d'/>
          <Segment textAlign='center' inverted>
            <Grid textAlign='center'>
            <Grid.Row style={{backgroundColor: "#1a1a1d"}}>
            <Button as={Link} to='/singleplayer'content='Play' color='green' style={{backgroundColor: "#ee4d40"}}></Button>
            </Grid.Row>
            <Grid.Row style={{backgroundColor: "#1a1a1d"}}>
            <Button as={Link} to='/multiplayer'content='Multiplayer' color='green' style={{backgroundColor: "#ee4d40"}}></Button>
            </Grid.Row>
            </Grid>
          
          
          </Segment>

          <hr color='#2d394d'/>
          
          
        </div>
      )
  }
}
