import React, { Component } from 'react';
import PropTypes from 'prop-types';
import withStyles from '@material-ui/core/styles/withStyles';
import CssBaseline from '@material-ui/core/CssBaseline';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';

import dotenv from 'dotenv';

var azure = require('azure-storage');

dotenv.config();

const styles = theme => ({
  root: {
    width: 'auto',
    marginTop: theme.spacing.unit * 2,
    marginLeft: theme.spacing.unit * 2,
    marginRight: theme.spacing.unit * 2,
    [theme.breakpoints.up(600 + theme.spacing.unit * 2 * 2)]: {
      width: 1000,
      marginLeft: 'auto',
      marginRight: 'auto',
    },
  },
  appBar: {
    position: 'relative',
  },
});

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      entries: []
    };
  }

  init() {
    var query = new azure.TableQuery();
    var retryOperations = new azure.ExponentialRetryPolicyFilter(3);
    var tableSvc = azure.createTableService(process.env.REACT_APP_AZURE_STORAGE_CONNECTION_STRING)
      .withFilter(retryOperations);
    var tableName = process.env.REACT_APP_AZURE_STORAGE_POPULAR_TWITS_TABLE;
    var t = this;
    tableSvc.queryEntities(tableName, query, null, function (error, result, response) {
      if (error) {
        console.error(error);
        return;
      }

      const entries = [];
      result.entries.forEach(x => {
        entries.push(JSON.parse(x.Payload._));
      })

      t.setState({ entries });
    });
  }

  componentDidMount() {
    this.init();
  }

  render() {
    const { classes } = this.props;
    return (
      <div>
        <CssBaseline />
        <AppBar position="absolute" color="default" className={classes.appBar}>
          <Toolbar>
            <Typography variant="h6" color="inherit" noWrap>
              Ra
            </Typography>
          </Toolbar>
        </AppBar>
        <div className={classes.root}>

          <List component="nav">
            {
              this.state.entries.map(x => {
                return (
                  <ListItem button key={x.id}>
                    <ListItemText primary={x.text} />
                  </ListItem>
                );
              })
            }
          </List>
        </div>
      </div>
    );
  }
}

App.propTypes = {
  classes: PropTypes.object.isRequired,
  children: PropTypes.node
};

export default withStyles(styles)(App);