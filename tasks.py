

import json
import os

from invoke import task


@task
def make_notes():

    notes = ''

    # Mush together files.
    for entry in os.scandir('data/notes'):
        with open(entry.path, 'r') as fh:
            notes += fh.read()

    notes = notes.replace('\n', ' ').split(' ')
    notes = [n for n in notes if n is not 'X']

    with open('src/javascripts/data/notes.json', 'w') as fh:
        json.dump(notes, fh)
