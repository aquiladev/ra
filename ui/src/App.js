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
import FavoriteBorderIcon from '@material-ui/icons/FavoriteBorder';
import RepeatIcon from '@material-ui/icons/Repeat';
import Divider from '@material-ui/core/Divider';
import Collapse from '@material-ui/core/Collapse';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';
import Avatar from '@material-ui/core/Avatar';

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
  post_footer: {
    display: 'flex',
    paddingTop: theme.spacing.unit
  },
  iBtn: {
    padding: 0
  },
  pl1: {
    paddingLeft: theme.spacing.unit
  },
  pl3: {
    paddingLeft: theme.spacing.unit * 3
  }
});

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      tableService: null,
      tableName: '',
      entries: [],
      isOpen: {}
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
        <AppBar position='absolute' color='default' className={classes.appBar}>
          <Toolbar>
            <Typography variant='h6' color='inherit' noWrap>
              Ra
            </Typography>
          </Toolbar>
        </AppBar>
        <div className={classes.root}>
          <List component='nav'>
            {
              this.state.entries.map(x => {
                const { urls, media } = x.entities;
                let link = '';
                if (urls && urls.length) {
                  const url =
                    urls.find(u => u.expanded_url.startsWith('https://twitter.com/')) || urls[0];
                  link = url.expanded_url;
                } else if (media && media.length) {
                  link = media[0].expanded_url;
                }

                return (
                  <React.Fragment key={x.id_str}>
                    <ListItem button
                      data-key={x.id_str}
                      component='a'
                      href={link}
                      target='_blank'>
                      <IconButton onClick={e => {
                        e.stopPropagation();
                        e.preventDefault();
                        this.setState({
                          isOpen: {
                            ...this.state.isOpen,
                            [x.id_str]: !this.state.isOpen[x.id_str]
                          }
                        })
                      }}>
                        {this.state.isOpen[x.id_str] ? <ExpandMore /> : <ExpandLess />}
                      </IconButton>
                      <Avatar src={x.user.profile_image_url}></Avatar>
                      <ListItemText primary={x.user.name} secondary={
                        <React.Fragment>
                          <Typography component='span' className={classes.inline} color='textPrimary'>
                            {x.text}
                          </Typography>
                          <span className={classes.post_footer}>
                            <span>
                              <FavoriteBorderIcon style={{ fontSize: 18 }} />
                              <span className={classes.pl1}>{x.favorite_count}</span>
                            </span>
                            <span className={classes.pl3}>
                              <RepeatIcon style={{ fontSize: 18 }} />
                              <span className={classes.pl1}>{x.retweet_count}</span>
                            </span>
                          </span>
                        </React.Fragment>
                      } />
                      <ListItemSecondaryAction>
                        <IconButton onClick={_ => this.delete(x.id_str)}>
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Collapse in={this.state.isOpen[x.id_str]} timeout="auto" unmountOnExit>
                      <Divider />
                      <List component="div" disablePadding>
                        <ListItem button className={classes.nested}>
                          <ListItemText inset primary={
                            <React.Fragment>
                              <pre>{JSON.stringify(x, undefined, 2)}</pre>
                            </React.Fragment>
                          } />
                        </ListItem>
                      </List>
                    </Collapse>
                    <Divider />
                  </React.Fragment>
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