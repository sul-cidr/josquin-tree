

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
  query(root, depth) {

    // find all occurrences of the root node
    // take the N next elements
    // zip through the pairs, index the tree

  }


}
