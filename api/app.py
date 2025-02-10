from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from sqlalchemy.sql import func
from flask_cors import CORS, cross_origin

from random import choices, randint
from datetime import datetime, timedelta

app = Flask(__name__)
cors = CORS(app)
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql://root@localhost/chaperone_scheduling'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['CORS_HEADERS'] = 'Content-Type'

db = SQLAlchemy(app)
migrate = Migrate(app, db)


class Event(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    title = db.Column(db.String(255), nullable=False)
    details = db.Column(db.String(9999), nullable=True)
    start = db.Column(db.DateTime, nullable=False)
    end = db.Column(db.DateTime, nullable=False)
    location = db.Column(db.String(255), nullable=False)
    lead_chaperone = db.Column(db.String(255), nullable=True)


class ChaperoneSlot(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    event_id = db.Column(db.Integer, nullable=False)
    start = db.Column(db.DateTime, nullable=False)
    end = db.Column(db.DateTime, nullable=False)
    chaperone = db.Column(db.String(255), nullable=True)
    details = db.Column(db.String(9999), nullable=True)
    title = db.Column(db.String(255), nullable=False)


class TemplateEvent(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    title = db.Column(db.String(255), nullable=False)
    details = db.Column(db.String(9999), nullable=True)
    start = db.Column(db.DateTime, nullable=False)
    end = db.Column(db.DateTime, nullable=False)
    location = db.Column(db.String(255), nullable=False)
    template_name = db.Column(db.String(255), nullable=False)


class TemplateChaperoneSlot(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    template_id = db.Column(db.Integer, nullable=False)
    start = db.Column(db.DateTime, nullable=False)
    end = db.Column(db.DateTime, nullable=False)
    details = db.Column(db.String(9999), nullable=True)
    title = db.Column(db.String(255), nullable=False)


def serialiseItem(item):
    item = item.__dict__
    item.pop('_sa_instance_state', None)
    return item


def serialiseItems(items):
    items_list = [serialiseItem(item) for item in items]
    return items_list


@app.route('/events', methods=['GET'])
def get_events():
    events = Event.query.all()
    return jsonify(serialiseItems(events))


@app.route('/events', methods=['PUT'])
def create_event():
    data = request.json
    try:
        event = Event(title=data['title'], details=data['details'],
                      start=data['start'], end=data['end'], location=data['location'])
        if 'lead_chaperone' in data:
            event.lead_chaperone = data['lead_chaperone']
        db.session.add(event)
        db.session.commit()
        return jsonify({'id': event.id}), 201
    except KeyError as e:
        return jsonify({'error': 'Invalid Data'}), 400


@app.route('/events/<int:event_id>', methods=['GET'])
def get_event(event_id):
    event = Event.query.get(event_id)
    return jsonify(serialiseItem(event))


@app.route('/events/<int:event_id>/<string:chaperone>', methods=['GET'])
def get_event_for_chaperone(event_id, chaperone):
    chaperone_slots = ChaperoneSlot.query.filter_by(
        event_id=event_id, chaperone=chaperone).all()
    return jsonify(serialiseItems(chaperone_slots))


@app.route('/events/<string:chaperone>', methods=['GET'])
def get_events_for_chaperone(chaperone):
    chaperone_slots = ChaperoneSlot.query.filter(
        ChaperoneSlot.chaperone == chaperone, ChaperoneSlot.end > datetime.now()).all()
    events = [Event.query.get(chaperone_slot.event_id)
              for chaperone_slot in chaperone_slots]
    unique_events = {event.id: event for event in events}.values()
    return jsonify(serialiseItems(unique_events))


@app.route('/events/<int:event_id>', methods=['DELETE'])
def delete_event(event_id):
    event = Event.query.get(event_id)
    db.session.delete(event)
    db.session.commit()
    return jsonify({'error': ''}), 200


@app.route('/events/<int:event_id>', methods=['PATCH'])
def update_event(event_id):
    data = request.json
    event = Event.query.get(event_id)
    if 'title' in data:
        event.title = data['title']
    if 'details' in data:
        event.details = data['details']
    if 'start' in data:
        event.start = data['start']
    if 'end' in data:
        event.end = data['end']
    if 'location' in data:
        event.location = data['location']
    if 'lead_chaperone' in data:
        event.lead_chaperone = data['lead_chaperone']
    db.session.commit()
    return jsonify({'error': ''}), 200


@app.route('/chaperone_slots', methods=['GET'])
def get_chaperone_slots():
    chaperone_slots = ChaperoneSlot.query.all()
    return jsonify(serialiseItems(chaperone_slots))


@app.route('/chaperone_slots/<int:event_id>', methods=['GET'])
def get_chaperone_slot(event_id):
    chaperone_slot = ChaperoneSlot.query.filter_by(event_id=event_id).all()
    return jsonify(serialiseItems(chaperone_slot))


@app.route('/chaperone_slots', methods=['PUT'])
def create_chaperone_slot():
    data = request.json
    try:
        chaperone_slot = ChaperoneSlot(
            event_id=data['event_id'], start=data['start'], end=data['end'], title=data['title'])

        if data['chaperone']:
            chaperone_slot.chaperone = data['chaperone']

        if data['details']:
            chaperone_slot.details = data['details']

        db.session.add(chaperone_slot)
        db.session.commit()
        return jsonify({'id': chaperone_slot.id}), 201
    except KeyError as e:
        return jsonify({'error': 'Invalid Data'}), 400


@app.route('/chaperone_slots/<int:event_id>', methods=['DELETE'])
def delete_chaperone_slot(event_id):
    chaperone_slots = ChaperoneSlot.query.filter_by(event_id=event_id).all()
    for slot in chaperone_slots:
        db.session.delete(slot)
    db.session.commit()
    return jsonify({'error': ''}), 200


@app.route('/chaperones', methods=['GET'])
def get_chaperones():
    chaperones = ChaperoneSlot.query.with_entities(
        ChaperoneSlot.chaperone).distinct().all()
    return jsonify(sorted([chaperone[0] for chaperone in chaperones]))


@app.route('/events_chaperones', methods=['GET'])
def get_chaperones_for_events():
    chaperones = [
        (chaperone_slot.chaperone, chaperone_slot.event_id) for chaperone_slot in ChaperoneSlot.query.all()]

    chaperones_dict = {}
    for chaperone, event_id in chaperones:
        if event_id not in chaperones_dict:
            chaperones_dict[event_id] = []
        chaperones_dict[event_id].append(chaperone)

    result = [{'event_id': event_id, 'chaperones': chaperones}
              for event_id, chaperones in chaperones_dict.items()]

    return jsonify(result)


@app.route('/chaperones/<int:event_id>', methods=['GET'])
def get_chaperones_for_event(event_id):
    chaperones = ChaperoneSlot.query.filter_by(event_id=event_id).with_entities(
        ChaperoneSlot.chaperone).distinct().all()
    return jsonify(sorted([chaperone[0] for chaperone in chaperones]))


@app.route('/templates', methods=['GET'])
def get_templates():
    templates = TemplateEvent.query.all()
    return jsonify(serialiseItems(templates))


@app.route('/templates/list', methods=['GET'])
def get_templates_list():
    templates = TemplateEvent.query.all()
    templates_list = [
        {'id': template.id, 'template_name': template.template_name} for template in templates]
    return jsonify(templates_list)


@app.route('/templates', methods=['PUT'])
def create_template():
    data = request.json
    try:
        template = TemplateEvent(title=data['title'], details=data['details'],
                                 start=data['start'], end=data['end'], location=data['location'], template_name=data['template_name'])
        db.session.add(template)
        db.session.commit()
        return jsonify({'id': template.id}), 201
    except KeyError as e:
        return jsonify({'error': 'Invalid Data'}), 400


@app.route('/templates/<int:template_id>', methods=['GET'])
def get_template(template_id):
    template = TemplateEvent.query.get(template_id)
    return jsonify(serialiseItem(template))


@app.route('/templates/<int:template_id>', methods=['DELETE'])
def delete_template(template_id):
    template = TemplateEvent.query.get(template_id)
    db.session.delete(template)
    db.session.commit()
    return jsonify({'error': ''}), 200


@app.route('/templates/<int:template_id>', methods=['PATCH'])
def update_template(template_id):
    data = request.json
    template = TemplateEvent.query.get(template_id)
    if 'title' in data:
        template.title = data['title']
    if 'details' in data:
        template.details = data['details']
    if 'start' in data:
        template.start = data['start']
    if 'end' in data:
        template.end = data['end']
    if 'location' in data:
        template.location = data['location']
    if 'template_name' in data:
        template.template_name = data['template_name']
    db.session.commit()
    return jsonify({'error': ''}), 200


@app.route('/template_chaperone_slots', methods=['GET'])
def get_template_chaperone_slots():
    template_chaperone_slots = TemplateChaperoneSlot.query.all()
    return jsonify(serialiseItems(template_chaperone_slots))


@app.route('/template_chaperone_slots/<int:template_id>', methods=['GET'])
def get_template_chaperone_slot(template_id):
    template_chaperone_slot = TemplateChaperoneSlot.query.filter_by(
        template_id=template_id).all()
    return jsonify(serialiseItems(template_chaperone_slot))


@app.route('/template_chaperone_slots', methods=['PUT'])
def create_template_chaperone_slot():
    data = request.json
    try:
        template_chaperone_slot = TemplateChaperoneSlot(
            template_id=data['template_id'], start=data['start'], end=data['end'], title=data['title'])

        if data['details']:
            template_chaperone_slot.details = data['details']

        db.session.add(template_chaperone_slot)
        db.session.commit()
        return jsonify({'id': template_chaperone_slot.id}), 201
    except KeyError as e:
        return jsonify({'error': 'Invalid Data'}), 400


@app.route('/template_chaperone_slots/<int:template_id>', methods=['DELETE'])
def delete_template_chaperone_slot(template_id):
    template_chaperone_slots = TemplateChaperoneSlot.query.filter_by(
        template_id=template_id).all()
    for slot in template_chaperone_slots:
        db.session.delete(slot)
    db.session.commit()
    return jsonify({'error': ''}), 200
