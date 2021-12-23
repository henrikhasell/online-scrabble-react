import {Navbar, Container, Form, FormControl, Button} from 'react-bootstrap'
import React, { useRef, useState } from 'react';

const expand = "md";

const LoginForm: React.FC = () => {
  const [game, setGame] = useState<string>("");
  const [name, setName] = useState<string>("");

  return (
    <Form className={`d-${expand}-flex`}>
      <FormControl
        className={`me-2 mt-2 mt-${expand}-0`}
        onChange={e => setGame(e.target.value)}
        placeholder="Game"
      />
      <FormControl
        className={`me-2 my-2 my-${expand}-0`}
        onChange={e => setName(e.target.value)}
        placeholder="Name"
      />
      <Button className="float-end text-nowrap" disabled={!game || !name} variant="success">Log In</Button>
    </Form>
  );
}

const navbar: React.FC = () => (
  <Navbar bg="dark" expanded={true} expand={expand} variant="dark">
  <Container fluid>
    <Navbar.Brand>Online Scrabble</Navbar.Brand>
    <Navbar.Collapse className="justify-content-end">
      <LoginForm/>
    </Navbar.Collapse>
  </Container>
  </Navbar>
);

export default navbar;