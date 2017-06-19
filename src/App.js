import React, {Component} from 'react';
import PropTypes from 'prop-types';
import { sortBy } from 'lodash';
import classNames from 'classnames';
import './App.css';

// const list = [
//   {
//     title: 'React',
//     url: 'https://facebook.github.io/react/',
//     author: 'Jordan Walke',
//     num_comments: 3,
//     points: 4,
//     objectID: 0
//   }, {
//     title: 'Redux',
//     url: 'https://github.com/reactjs/redux',
//     author: 'Dan Abramov, Andrew Clark',
//     num_comments: 2,
//     points: 5,
//     objectID: 1
//   }
// ];

import { DEFAULT_QUERY, DEFAULT_PAGE, DEFAULT_HPP,
  PATH_BASE,
  PATH_SEARCH,
  PARAM_SEARCH,
  PARAM_PAGE,
  PARAM_HPP,
} from './constants';

const SORTS = {
  NONE: list => list,
  TITLE: list => sortBy(list, 'title'),
  AUTHOR: list => sortBy(list, 'author'),
  COMMENTS: list => sortBy(list, 'num_comments').reverse(),
  POINTS: list => sortBy(list, 'points').reverse(),
};

const isSearched = (searchTerm) => (item) => !searchTerm || item.title.toLowerCase().includes(searchTerm.toLowerCase());

const updateSearchTopstoriesState = (hits, page) => (prevState) => {
  const { searchKey, results } = prevState;

  const oldHits = results && results[searchKey] ? results[searchKey].hits : [];
  const updatedHits = [...oldHits, ...hits];
  return {
    results : {
      ...results,
      [searchKey]: {
        hits: updatedHits,
        page,
      }
    },
    isLoading: false,
  };
  
};

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      results: null,
      searchKey: '',
      searchTerm: DEFAULT_QUERY,
      isLoading: false,
      // sortKey: 'NONE',
      // isSortReverse: false,
    };

    this.needsToSearchTopstories = this.needsToSearchTopstories.bind(this);
    this.setSearchTopstories = this.setSearchTopstories.bind(this);
    this.fetchSearchTopstories = this.fetchSearchTopstories.bind(this);
    this.onSearchChange = this.onSearchChange.bind(this);
    this.onSearchSubmit = this.onSearchSubmit.bind(this);
    this.onDismiss = this.onDismiss.bind(this);
    // this.onSort = this.onSort.bind(this);
  }

  needsToSearchTopstories(searchTerm) {
    return !this.state.results[searchTerm];
  }
  
  setSearchTopstories(result) {
    const { hits, page } = result;
    this.setState(updateSearchTopstoriesState(hits, page));
  }

  
  fetchSearchTopstories(searchTerm, page) {
    this.setState({
      isLoading: true
    });
    fetch(`${PATH_BASE}${PATH_SEARCH}?${PARAM_SEARCH}${searchTerm}&${PARAM_PAGE}${page}&${PARAM_HPP}${DEFAULT_HPP}`)
      .then(response => response.json())
      .then(result => this.setSearchTopstories(result));
  }

  componentDidMount() {
    const { searchTerm } = this.state;
    this.setState({
      searchKey: searchTerm
    });
    this.fetchSearchTopstories(searchTerm, DEFAULT_PAGE);
  }

  onSearchChange(event) {
    this.setState({
      searchTerm: event.target.value,
    })
  }

  onSearchSubmit(event) {
    const { searchTerm } = this.state;
    this.setState({
      searchKey: searchTerm
    });
    if (this.needsToSearchTopstories(searchTerm)) {
      this.fetchSearchTopstories(searchTerm, DEFAULT_PAGE);
    }
    event.preventDefault();
  }

  onDismiss(id) {
    const { searchKey, results } = this.state;
    const { hits, page } = results[searchKey];

    const isNotId = item => item.objectID !== id;
    const updatedHits = hits.filter(isNotId);
    
    this.setState({
      results: {
        ...results,
        [searchKey]: { hits: updatedHits, page }
      }
    })
  }

  // onSort(sortKey) {
  //   const isSortReverse = this.state.sortKey === sortKey && !this.state.isSortReverse;

  //   this.setState({ sortKey, isSortReverse });
  // }
  
  render() {
    const { 
      searchTerm, 
      results,
      searchKey,
      isLoading,
      // sortKey,
      // isSortReverse,
    } = this.state;
    const page = (results && results[searchKey] && results[searchKey].page) || 0;

    const list = (
      results &&
      results[searchKey] &&
      results[searchKey].hits
    ) || [];

    return (
      <div className="page">
        <div className="interactions">
          <Search
          value={searchTerm}
          onChange={this.onSearchChange} 
          onSubmit={this.onSearchSubmit}
        >
          Search
        </Search>
        </div>
        
        <Table
          list={list}
          onDismiss={this.onDismiss} 
        />
      
        <div className="interactions">
          <ButtonWithLoading
          isLoading={isLoading}
          onClick={ () => this.fetchSearchTopstories(searchKey, page + 1) }
          >
          More
          </ButtonWithLoading>
        </div>
      </div>
    );
  }
}
export default App;

const Loading = () => <div>
  <i className="fa fa-spinner fa-3x fa-spin fa fw"></i>
  <span className="sr-only">Loading ...
  </span>
  </div>

class Search extends Component {
  componentDidMount() {
    try {
      this.input.focus();
    } catch (e) {
      console.log(e);
    }
  }
  render() {
    const {value, onChange, onSubmit, children} = this.props;
    return (
      <form onSubmit={onSubmit}>
        {children}
        <input
          type="text"
          value={value}
          onChange={onChange}
          ref={(node) => {
          this.input = node;
        }}
          onSubmit={onSubmit}/>
        <button type="submit">
          {children}
        </button>
      </form>
    );
  }
}

class Table extends Component {
  constructor(props) {
    super(props);
    this.state = {
      sortKey: 'NONE',
      isSortReverse: false,
    };
    this.onSort = this.onSort.bind(this);
  }
  onSort(sortKey) {
    const isSortReverse = this.state.sortKey === sortKey && !this.state.isSortReverse;
    this.setState({
      sortKey,
      isSortReverse
    });
  }
  render() {
    const { 
      list, 
      onDismiss,
    } = this.props;
    const {
      sortKey, 
      onSort, 
      isSortReverse 
    } = this.state;
    const largeColumn = {
      width: '40%',
    };
    const midColumn = {
      width: '30%',
    };
    const smallColumn = {
      width: '10%',
    };
    const sortedList = SORTS[sortKey](list);
    const reserveSortedList = isSortReverse ? sortedList.reverse() : sortedList;
    return (
      <div className="table">
        <div className="table-header">
          <span style={largeColumn}>
            <Sort sortKey={'TITLE'} onSort={this.onSort} activeSortKey={sortKey} isSortReverse={isSortReverse}>
              Title
            </Sort>
          </span>
          <span style={midColumn}>
            <Sort sortKey={'AUTHOR'} onSort={this.onSort} activeSortKey={sortKey} isSortReverse={isSortReverse}>
              Author
            </Sort>
          </span>
          <span style={smallColumn}>
            <Sort sortKey={'COMMENTS'} onSort={this.onSort} activeSortKey={sortKey} isSortReverse={isSortReverse}>
              Comments
            </Sort>
          </span>
          <span style={smallColumn}>
            <Sort sortKey={'POINTS'} onSort={this.onSort} activeSortKey={sortKey} isSortReverse={isSortReverse}>
              Points
            </Sort>
          </span>
          <span style={smallColumn}>
            
              Archive
            
          </span>
        </div>
        { reserveSortedList.map(item =>
          <div key={item.objectID} className="table-row">
            <span style={largeColumn}>
              <a href={item.url}>
                {item.title}
              </a>
            </span>
            <span style={midColumn}>
              {item.author}
            </span>
            <span style={smallColumn}>
              {item.num_comments}
            </span>
            <span style={smallColumn}>
              {item.points}
            </span>
            <span style={smallColumn}>
              <Button
                onClick={ () => onDismiss(item.objectID) }
                className="button-inline"
              >
                Dismiss
              </Button>
            </span>
          </div>
        )}
      </div>
    );
  }
}

Table.propTypes = {
  // list: PropTypes.array.isRequired,
  list: PropTypes.arrayOf(
    PropTypes.shape({
      objectID: PropTypes.string.isRequired,
      author: PropTypes.string,
      url: PropTypes.string,
      num_comments: PropTypes.number,
      points: PropTypes.number,
    })
  ).isRequired,
  onDismiss: PropTypes.func.isRequired,
};

const Button = ( {onClick, className = '', children } ) =>
  <button
  onClick={onClick}
  className={className}
  type="button"
  >
    {children}
  </button>

Button.defaultProps = {
  className: '',
}

Button.propTypes = {
  onClick: PropTypes.func.isRequired,
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
};

const withFoo = (Component) => (props) => <Component { ...props } />

// const withLoading = (Component) => (props) => props.isLoading ? <Loading /> : <Component { ...props } />;
const withLoading = (Component) => ({ isLoading, ...rest }) => isLoading ? <Loading /> : <Component { ...rest } />

const ButtonWithLoading = withLoading(Button)

const Sort = ({
  sortKey, 
  activeSortKey, 
  onSort,
  isSortReverse,
  children
}) => {
  const sortClass = classNames(
    'button-inline',
    { 'button-active': sortKey === activeSortKey},
  );
  const faClass = classNames(
    'fa',
    { 'fa-angle-up': !isSortReverse },
    { 'fa-angle-down': isSortReverse },
  );
  return (
    <Button 
      onClick={ () => onSort(sortKey) }
      className={sortClass}>
      {children}
      { sortKey === activeSortKey ?
        <i className={faClass}></i>
        : ''
      }
    </Button>
  );
}

export {
  Button,
  Search,
  Table,
  withLoading,
  Sort,
  ButtonWithLoading,
};
