import { courseName, COURSE_SCHEDULE } from "../lib/mockData";
import type { Course, Task } from "../types";
export default function CoursesView({
  tasks,
  onSelect,
}: {
  tasks: Task[];
  onSelect: (course: Course) => void;
}) {
  return (
    <>
      <div className="page-title">
        <small>SEMESTER 7</small>
        <h1>Mata Kuliah</h1>
      </div>
      <div className="courses-grid">
        {COURSE_SCHEDULE.map((course) => {
          const active = tasks.filter(
            (t) => t.courseCode === course.code && !t.completed,
          ).length;
          return (
            <button
              key={course.code}
              className="course-card"
              style={{ "--course-color": course.color } as React.CSSProperties}
              onClick={() => onSelect(course)}
            >
              <span className="course-color" />
              <small>
                {course.code} · {course.sks} SKS
              </small>
              <h2>{courseName(course.code)}</h2>
              <p>{course.lecturer}</p>
              <dl>
                <div>
                  <dt>Jadwal</dt>
                  <dd>
                    {course.dayName}, {course.startTime}–{course.endTime}
                  </dd>
                </div>
                <div>
                  <dt>Ruang</dt>
                  <dd>{course.room}</dd>
                </div>
              </dl>
              <b>{active} tugas aktif</b>
            </button>
          );
        })}
      </div>
    </>
  );
}
