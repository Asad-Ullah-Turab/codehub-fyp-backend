// Unit tests for quiz and certificate controller notifications
import { submitQuizAnswers } from '../../src/controllers/quizCertificateController.js';
import Quiz from '../../src/models/Quiz.js';
import Course from '../../src/models/Course.js';
import CourseSection from '../../src/models/CourseSection.js';
import CourseLesson from '../../src/models/CourseLesson.js';
import CourseEnrollment from '../../src/models/CourseEnrollment.js';
import Certificate from '../../src/models/Certificate.js';
import User from '../../src/models/User.js';

// mock request/response as in other tests
const mockRequest = (body = {}, params = {}, query = {}, user = null) => ({
  body,
  params,
  query,
  user
});
const mockResponse = () => {
  const res = {};
  res.status = function(code) { this.statusCode = code; return this; };
  res.json = function(data) { this.responseData = data; return this; };
  return res;
};

describe('QuizCertificate Controller', () => {
  let userId;
  let courseId;
  let sectionId;
  let quizId;

  beforeEach(async () => {
    // clear collections
    await User.deleteMany({});
    await Course.deleteMany({});
    await CourseSection.deleteMany({});
    await CourseLesson.deleteMany({});
    await Quiz.deleteMany({});
    await CourseEnrollment.deleteMany({});
    await Certificate.deleteMany({});

    // create user
    const user = await User.create({
      name: 'Test Student',
      email: 'student@example.com',
      password: 'password',
      isEmailVerified: true
    });
    userId = user._id.toString();

    // create course with one section
    const course = await Course.create({
      title: 'Sample Course',
      description: 'desc',
      shortDescription: 'short',
      language: 'javascript',
      category: 'web',
      difficulty: 'beginner',
      instructor: userId,
      duration: 5,
      isPublished: true
    });
    courseId = course._id.toString();

    const section = await CourseSection.create({
      course: courseId,
      title: 'Section 1',
      order: 1
    });
    sectionId = section._id.toString();

    // link section to course
    course.sections = [section._id];
    await course.save();

    // create a simple quiz for that section
    const quiz = await Quiz.create({
      title: 'Section Quiz',
      course: courseId,
      type: 'section-quiz',
      section: sectionId,
      passingScore: 50,
      questions: [
        {
          question: 'What is 1+1?',
          type: 'multiple-choice',
          options: [
            { text: '2', isCorrect: true },
            { text: '3', isCorrect: false }
          ],
          points: 10
        }
      ]
    });
    quizId = quiz._id.toString();

    // create enrollment for user
    await CourseEnrollment.create({ user: userId, course: courseId, sectionProgress: [] });
  });

  it('should notify the user when they complete the course via quiz submission', async () => {
    const notifSpy = jest.spyOn(require('../../src/controllers/notificationController.js'), 'createNotification');
    notifSpy.mockResolvedValue({});

    const req = mockRequest({
      quizId,
      courseId,
      sectionId,
      answers: { }
    }, {}, {}, { _id: userId });

    // choose correct answer text
    req.body.answers = {};
    req.body.answers[quizId]; // not used directly
    // but controller reads answers[question._id]
    // we can compute from quiz object
    const questionId = (await Quiz.findById(quizId)).questions[0]._id.toString();
    req.body.answers[questionId] = '2';

    const res = mockResponse();

    await submitQuizAnswers(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.responseData.success).toBe(true);

    expect(notifSpy).toHaveBeenCalledWith(expect.objectContaining({
      userId,
      type: 'courseCompletion'
    }));
  });
});