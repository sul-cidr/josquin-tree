

import _ from 'lodash';


export default class {


  /**
   * Initialize empty tree.
   *
   * @param {Array} sequence
   */
  constructor(sequence) {

    this.sequence = sequence;
    this.tree = {};

    this._index();

  }


  /**
   * Index the tree.
   */
  _index() {

    for (let i=0; i < this.sequence.length-1; i++) {

      let a = this.sequence[i];
      let b = this.sequence[i+1];

      if (!_.has(this.tree, a)) {
        this.tree[a] = {};
      }

      else if (!_.has(this.tree[a], b)) {
        this.tree[a][b] = 1;
      }

      else {
        this.tree[a][b]++;
      }

    }

  }


  /**
   * Query a subtree.
   *
   * @param {Mixed} root
   * @param {Number} depth
   * @param {Number} size
   */
  query(root, depth, size=null) {

    let subtree = {
      name: root,
      size: size,
    };

    if (depth > 0) {

      let pairs = _.pairs(this.tree[root]);

      // Sort by count ASC.
      pairs = _.sortBy(pairs, function(p) {
        return p[1];
      });

      // Sort DESC.
      pairs = pairs.reverse();

      subtree.children = _.map(pairs, p => {
        return this.query(p[0], depth-1, p[1]);
      });

    }

    return subtree;

  }


}
