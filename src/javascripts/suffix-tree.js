

import _ from 'lodash';


export default class {


  /**
   * Set the raw sequence.
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


}
