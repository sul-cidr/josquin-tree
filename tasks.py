

import json
import os

from invoke import task


@task
def make_notes():

    notes = ''

    for entry in os.scandir('data/notes'):
        with open(entry.path, 'r') as fh:
            notes += fh.read()

    notes = notes.replace('\n', ' ').split(' ')

    with open('src/javascripts/data/notes.json', 'w') as fh:
        json.dump(notes, fh)
