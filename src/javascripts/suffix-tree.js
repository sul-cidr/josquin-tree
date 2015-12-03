

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

      // if not tree has a, tree.a = {}
      // if not tree.a.b, tree.a.b = 1
      // else tree.a.b++

    }

  }


}
