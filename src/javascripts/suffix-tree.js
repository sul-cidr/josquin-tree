

import _ from 'lodash';


export default class {


  /**
   * Initialize empty tree.
   *
   * @param {Array} seq
   */
  constructor(seq) {
    this.seq = seq;
    this._indexOffsets();
  }


  /**
   * Map token -> [offsets]
   */
  _indexOffsets() {

    this.offsets = {};

    _.each(this.seq, (el, i) => {

      if (!_.has(this.offsets, el)) {
        this.offsets[el] = [i];
      }

      else {
        this.offsets[el].push(i);
      }

    });

  }


  /**
   * Query a suffix tree.
   *
   * @param {Mixed} root
   */
  query(root, depth=10) {

    // find all occurrences of the root node
    // take the N next elements
    // zip through the pairs, index the tree

    let suffixes = _.map(this.offsets[root], i => {
      return this.seq.slice(i+1, i+1+depth);
    });

    let tree = {
      name: root,
      count: 1,
    };

    _.each(suffixes, suffix => {
      _.reduce(suffix, function(parent, token) {

        let leaf;

        // If no children, initialize the array and set the first value.

        if (!parent.children) {

          leaf = {
            name: token,
            count: 0,
          }

          parent.children = [leaf];

        }

        // Otherwise, probe for an existing entry for the new token.

        else {

          let existing = _.find(parent.children, function(child) {
            return child.name == token;
          });

          if (existing) {
            existing.count++;
            leaf = existing;
          }

          else {

            leaf = {
              name: token,
              count: 0,
            }

            parent.children.push(leaf);

          }

        }

        return leaf;

      }, tree);
    });

    return tree;

  }


}
