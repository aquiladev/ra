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
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';

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
      tableService: null,
      tableName: '',
      entries: []
    };

    this.delete = this.delete.bind(this);
  }

  init() {
    var query = new azure.TableQuery().where('Deleted eq ?', false);
    var retryOperations = new azure.ExponentialRetryPolicyFilter(3);
    var tableService = azure.createTableService(process.env.REACT_APP_AZURE_STORAGE_CONNECTION_STRING)
      .withFilter(retryOperations);
    var tableName = process.env.REACT_APP_AZURE_STORAGE_POPULAR_TWITS_TABLE;
    var t = this;
    tableService.queryEntities(tableName, query, null, function (error, result) {
      if (error) {
        console.error(error);
        return;
      }

      const entries = [];
      result.entries.forEach(x => {
        entries.push(JSON.parse(x.Payload._));
      })

      t.setState({ tableService, tableName, entries });
    });
  }

  componentDidMount() {
    this.init();
  }

  delete(id) {
    var t = this;
    const { tableName, tableService } = this.state;

    tableService.retrieveEntity(tableName, id.toString(), '', function (error, result) {
      if (error) {
        console.error(error);
        return;
      }

      const entity = { ...result, Deleted: true };
      tableService.replaceEntity(tableName, entity, function (err) {
        if (err) {
          console.error(err);
          return;
        }

        t.setState({
          entries: t.state.entries.filter(x => x.id_str !== id)
        });
      });
    });
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
                console.log(x)
                let link = {};
                if (x.entities.urls && x.entities.urls.length) {
                  link = x.entities.urls[0];
                } else if (x.entities.media && x.entities.media.length) {
                  link = x.entities.media[0];
                }

                return (
                  <ListItem button
                    key={x.id_str}
                    data-key={x.id_str}
                    component="a"
                    href={link.expanded_url}
                    target="_blank">
                    <ListItemText primary={x.text} />
                    <ListItemSecondaryAction>
                      <IconButton aria-label="Comments"
                        onClick={_ => this.delete(x.id_str)}>
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
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