import {Navbar, Container, Form, FormControl, Button} from 'react-bootstrap'
import React, { useState } from 'react';
import LoginDetails from './LoginDetails';

const expand = "md";

interface LoginFormProps {
  setLoginDetails: (i: LoginDetails | null) => void;
};

const LoginForm: React.FC<LoginFormProps> = ({setLoginDetails}) => {
  const [game, setGame] = useState<string>("");
  const [name, setName] = useState<string>("");

  const buttonProps = {
    className: "float-end text-nowrap",
    disabled: !game || !name,
    onClick: () => setLoginDetails({game, name}),
    variant: "success"
  };

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
      <Button {...buttonProps}>Log In</Button>
    </Form>
  );
};

const LoginInfo: React.FC<LoginDetails> = ({game, name}) => (
  <Navbar.Text>Game: <u>{game}</u> Name: <u>{name}</u></Navbar.Text>
);

interface NavbarProps {
  loginDetails: LoginDetails | null;
  setLoginDetails: (i: LoginDetails | null) => void;
};

const navbar: React.FC<NavbarProps> = ({loginDetails, setLoginDetails}) => (
  <Navbar bg="dark" expanded={true} expand={expand} variant="dark">
  <Container fluid>
    <Navbar.Brand>Online Scrabble</Navbar.Brand>
    <Navbar.Collapse className="justify-content-end">
      {loginDetails ? <LoginInfo {...loginDetails}/> : <LoginForm setLoginDetails={setLoginDetails}/>}
    </Navbar.Collapse>
  </Container>
  </Navbar>
);

export default navbar;