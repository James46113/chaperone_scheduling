export async function onRequest({ request, env, data }) {
    if (request.method === "POST") {
        if (!data.user.is_admin) {
            return new Response("Forbidden", { status: 403 })
        }
        let body;
        try {
            body = await request.json()
        } catch (error) {
            return new Response("Invalid JSON", { status: 400 })
        }

        if ([body.start, body.end].some(value => value === undefined || value === null)) {
            return new Response("Start and end dates are required", { status: 400 })
        }

        let start = new Date(body.start)
        let end = new Date(body.end)
        const mondayTemplateID = body.monday_template_id ?? '2'
        const fridayTemplateID = body.friday_template_id ?? '3'

        const mondayTemplate = await env.DB.prepare("SELECT * FROM template_event WHERE id = ?").bind(mondayTemplateID).first()
        const { results: mondayTemplateSlots } = await env.DB.prepare("SELECT * FROM template_chaperone_slot WHERE template_id = ?").bind(mondayTemplateID).all()
        const fridayTemplate = await env.DB.prepare("SELECT * FROM template_event WHERE id = ?").bind(fridayTemplateID).first()
        const { results: fridayTemplateSlots } = await env.DB.prepare("SELECT * FROM template_chaperone_slot WHERE template_id = ?").bind(fridayTemplateID).all()

        const { results: allChaperonesIDs } = await env.DB.prepare("SELECT id FROM chaperone").all()

        if (!mondayTemplate || !fridayTemplate) {
            return new Response("Invalid template IDs", { status: 400 })
        }

        const eventsToCreate = []

        while (start <= end) {
            if (start.getDay() === 1) {
                eventsToCreate.push(createEventFromTemplate(mondayTemplate, mondayTemplateSlots, allChaperonesIDs, start, env))
            } else if (start.getDay() === 5) {
                eventsToCreate.push(createEventFromTemplate(fridayTemplate, fridayTemplateSlots, allChaperonesIDs, start, env))
            }
            start.setDate(start.getDate() + 1)
        }

        await Promise.all(eventsToCreate)

        return new Response("Term created", { status: 201 })
    }

    else {
        return new Response("Method Not Allowed", {
            status: 405,
            headers: {
                Allow: "POST",
            },
        })
    }
}

async function createEventFromTemplate(template, templateSlots, chaperoneIDs, date, env) {
    const start = new Date(date)
    start.setHours(new Date(template.start).getHours())
    start.setMinutes(new Date(template.start).getMinutes())

    const end = new Date(date)
    end.setHours(new Date(template.end).getHours())
    end.setMinutes(new Date(template.end).getMinutes())

    const { id: eventID } = await env.DB.prepare("INSERT INTO event (title, details, start, end, location, juniors_present) VALUES (?, ?, ?, ?, ?, ?) RETURNING id").bind(template.title, template.details, start.toISOString(), end.toISOString(), template.location, template.juniors_present).first()

    await Promise.all([

        Promise.all(templateSlots.map(slot => {
            const slotStart = new Date(date)
            slotStart.setHours(new Date(slot.start).getHours())
            slotStart.setMinutes(new Date(slot.start).getMinutes())

            const slotEnd = new Date(date)
            slotEnd.setHours(new Date(slot.end).getHours())
            slotEnd.setMinutes(new Date(slot.end).getMinutes())

            return env.DB.prepare("INSERT INTO chaperone_slot (title, details, start, end, event_id) VALUES (?, ?, ?, ?, ?)")
                .bind(slot.title, slot.details, slotStart.toISOString(), slotEnd.toISOString(), eventID)
                .run()
        })),

        Promise.all(chaperoneIDs.map(({ id: chaperoneID }) =>
            env.DB.prepare("INSERT INTO chaperone_availability (event_id, chaperone_id) VALUES (?, ?)")
                .bind(eventID, chaperoneID)
                .run()))
    ])
}