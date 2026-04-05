import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * CRON: Process recurring tasks.
 * When a recurring task is completed, create the next instance.
 * Run daily via external CRON trigger.
 */
export async function GET(request: Request) {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Find completed tasks with active recurrence
        const completedRecurring = await prisma.task.findMany({
            where: {
                completed: true,
                recurrence: { not: "none" },
                date: { not: "" },
            },
            select: {
                id: true, title: true, description: true, date: true, time: true,
                dueDate: true, priority: true, recurrence: true, recurrenceEnd: true,
                listId: true, createdById: true, assigneeId: true,
                clientId: true, negotiationId: true, groupId: true,
            },
        });

        let created = 0;
        const operations: any[] = [];

        for (const task of completedRecurring) {
            const nextDate = computeNextDate(task.date, task.recurrence);

            // Skip if past recurrence end date
            if (task.recurrenceEnd && nextDate > task.recurrenceEnd) {
                operations.push(
                    prisma.task.update({ where: { id: task.id }, data: { recurrence: "none" } })
                );
                continue;
            }

            // Check if next instance already exists (prevent duplicates)
            const existing = await prisma.task.findFirst({
                where: {
                    title: task.title,
                    date: nextDate,
                    listId: task.listId,
                    createdById: task.createdById,
                    completed: false,
                },
            });

            if (existing) continue;

            // Compute next dueDate based on offset from original
            let nextDueDate = "";
            if (task.dueDate && task.date) {
                const originalDate = new Date(task.date + "T12:00:00");
                const originalDue = new Date(task.dueDate + "T12:00:00");
                const offsetMs = originalDue.getTime() - originalDate.getTime();
                const nextDueDateObj = new Date(new Date(nextDate + "T12:00:00").getTime() + offsetMs);
                nextDueDate = `${nextDueDateObj.getFullYear()}-${String(nextDueDateObj.getMonth() + 1).padStart(2, "0")}-${String(nextDueDateObj.getDate()).padStart(2, "0")}`;
            }

            // Batch: create next + clear original
            operations.push(
                prisma.task.create({
                    data: {
                        title: task.title,
                        description: task.description,
                        date: nextDate,
                        time: task.time,
                        dueDate: nextDueDate,
                        priority: task.priority,
                        recurrence: task.recurrence,
                        recurrenceEnd: task.recurrenceEnd,
                        listId: task.listId,
                        createdById: task.createdById,
                        assigneeId: task.assigneeId,
                        clientId: task.clientId,
                        negotiationId: task.negotiationId,
                        groupId: task.groupId,
                    },
                })
            );
            operations.push(
                prisma.task.update({ where: { id: task.id }, data: { recurrence: "none" } })
            );
            created++;
        }

        // Execute all operations atomically
        if (operations.length > 0) {
            await prisma.$transaction(operations);
        }

        return NextResponse.json({ processed: completedRecurring.length, created });
    } catch (error) {
        console.error("Cron tasks-recurrence error:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

function computeNextDate(dateStr: string, recurrence: string): string {
    const d = new Date(dateStr + "T12:00:00");

    switch (recurrence) {
        case "daily":
            d.setDate(d.getDate() + 1);
            break;
        case "weekly":
            d.setDate(d.getDate() + 7);
            break;
        case "monthly":
            d.setMonth(d.getMonth() + 1);
            break;
        case "yearly":
            d.setFullYear(d.getFullYear() + 1);
            break;
    }

    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
