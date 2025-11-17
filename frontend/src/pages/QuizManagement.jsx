import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { Plus, Clock, BarChart3, Eye, Play } from "lucide-react";
import { toast } from "sonner";
import LoadingSpinner from "../components/LoadingSpinner";

const QuizManagement = () => {
    const { courseId } = useParams();
    const [course, setCourse] = useState(null);
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [expandedGrades, setExpandedGrades] = useState({});
    const [gradesByQuiz, setGradesByQuiz] = useState({});
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        openAt: "",
        closeAt: "",
        durationMinutes: 10,
        attemptsAllowed: 1,
    });

    useEffect(() => {
        fetchCourseData();
    }, [courseId]);

    const fetchCourseData = async () => {
        try {
            setLoading(true);

            // Fetch course details
            const courseResponse = await axios.get(
                `http://localhost:3000/quizzes/${courseId}/quizzes`
            );
            setCourse(courseResponse.data.course);
            setQuizzes(courseResponse.data.quizzes);
        } catch (error) {
            console.error("Error fetching course data:", error);
            toast.error("Failed to load course data");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateQuiz = async (e) => {
        e.preventDefault();

        try {
            const open = new Date(formData.openAt);
            const close = new Date(formData.closeAt);
            if (isNaN(open.getTime()) || isNaN(close.getTime())) {
                toast.error("Please provide valid open and close dates");
                return;
            }
            if (open >= close) {
                toast.error("Open date must be before close date");
                return;
            }

            const token = localStorage.getItem('token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            const response = await axios.post(
                `http://localhost:3000/quizzes/${courseId}/quizzes`,
                {
                    ...formData,
                    openAt: new Date(formData.openAt).toISOString(),
                    closeAt: new Date(formData.closeAt).toISOString(),
                },
                { headers }
            );

            setQuizzes([response.data.quiz, ...quizzes]);
            setFormData({
                title: "",
                description: "",
                openAt: "",
                closeAt: "",
                durationMinutes: 10,
                attemptsAllowed: 1,
            });
            setShowCreateForm(false);

            toast.success("Quiz created successfully!");
        } catch (error) {
            console.error("Error creating quiz:", error);
            toast.error(error.response?.data?.error || "Failed to create quiz");
        }
    };

    const handlePublishQuiz = async (quizId) => {
        try {
            await axios.post(`http://localhost:3000/quizzes/${quizId}/publish`);

            setQuizzes(
                quizzes.map((quiz) =>
                    quiz._id === quizId ? { ...quiz, published: true } : quiz
                )
            );

            toast.success("Quiz published successfully!");
        } catch (error) {
            console.error("Error publishing quiz:", error);
            toast.error("Failed to publish quiz");
        }
    };

    const toggleGrades = async (quizId) => {
        const currentlyExpanded = !!expandedGrades[quizId];
        const nextExpanded = {
            ...expandedGrades,
            [quizId]: !currentlyExpanded,
        };
        setExpandedGrades(nextExpanded);
        if (!currentlyExpanded && !gradesByQuiz[quizId]) {
            try {
                const res = await axios.get(
                    `http://localhost:3000/quizzes/${quizId}/grades`
                );
                setGradesByQuiz({
                    ...gradesByQuiz,
                    [quizId]: res.data.results || [],
                });
            } catch (error) {
                toast.error(
                    error.response?.data?.error || "Failed to load grades"
                );
            }
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const isQuizOpen = (quiz) => {
        const now = new Date();
        const openAt = new Date(quiz.openAt);
        const closeAt = new Date(quiz.closeAt);
        return now >= openAt && now <= closeAt;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <LoadingSpinner size="large" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Link
                        to="/courses"
                        className="text-blue-600 hover:text-blue-800 mb-2 inline-block"
                    >
                        ← Back to Courses
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">
                        {course?.title || "Course"}
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Manage quizzes for this course
                    </p>
                </div>

                <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Quiz
                </button>
            </div>

            {/* Create Quiz Form */}
            {showCreateForm && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                        Create New Quiz
                    </h2>

                    <form onSubmit={handleCreateQuiz} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label
                                    htmlFor="title"
                                    className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                    Quiz Title *
                                </label>
                                <input
                                    type="text"
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            title: e.target.value,
                                        })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter quiz title"
                                    required
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="durationMinutes"
                                    className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                    Duration (minutes) *
                                </label>
                                <input
                                    type="number"
                                    id="durationMinutes"
                                    value={formData.durationMinutes}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            durationMinutes: parseInt(
                                                e.target.value
                                            ),
                                        })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    min="1"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label
                                htmlFor="description"
                                className="block text-sm font-medium text-gray-700 mb-1"
                            >
                                Description
                            </label>
                            <textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        description: e.target.value,
                                    })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter quiz description (optional)"
                                rows={2}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label
                                    htmlFor="openAt"
                                    className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                    Open Date & Time *
                                </label>
                                <input
                                    type="datetime-local"
                                    id="openAt"
                                    value={formData.openAt}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            openAt: e.target.value,
                                        })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="closeAt"
                                    className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                    Close Date & Time *
                                </label>
                                <input
                                    type="datetime-local"
                                    id="closeAt"
                                    value={formData.closeAt}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            closeAt: e.target.value,
                                        })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label
                                htmlFor="attemptsAllowed"
                                className="block text-sm font-medium text-gray-700 mb-1"
                            >
                                Attempts Allowed *
                            </label>
                            <input
                                type="number"
                                id="attemptsAllowed"
                                value={formData.attemptsAllowed}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        attemptsAllowed: parseInt(
                                            e.target.value
                                        ),
                                    })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                min="1"
                                required
                            />
                        </div>

                        <div className="flex space-x-3">
                            <button
                                type="submit"
                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                            >
                                Create Quiz
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowCreateForm(false)}
                                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Quizzes List */}
            <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Course Quizzes
                    </h2>
                </div>

                <div className="p-6">
                    {quizzes.length === 0 ? (
                        <div className="text-center py-8">
                            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                No quizzes yet
                            </h3>
                            <p className="text-gray-500">
                                Create your first quiz to get started.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {quizzes.map((quiz) => (
                                <div
                                    key={quiz._id}
                                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                {quiz.title}
                                            </h3>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {quiz.description ||
                                                    "No description available"}
                                            </p>

                                            <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                                                <div className="flex items-center">
                                                    <Clock className="h-4 w-4 mr-1" />
                                                    {quiz.durationMinutes}{" "}
                                                    minutes
                                                </div>
                                                <div className="flex items-center">
                                                    Status:
                                                    <span
                                                        className={`ml-1 px-2 py-1 rounded-full text-xs ${
                                                            quiz.published
                                                                ? isQuizOpen(
                                                                      quiz
                                                                  )
                                                                    ? "bg-green-100 text-green-800"
                                                                    : "bg-blue-100 text-blue-800"
                                                                : "bg-yellow-100 text-yellow-800"
                                                        }`}
                                                    >
                                                        {quiz.published
                                                            ? isQuizOpen(quiz)
                                                                ? "Open"
                                                                : "Scheduled"
                                                            : "Draft"}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-4 mt-2 text-sm">
                                                <span className="text-gray-500">
                                                    Opens:{" "}
                                                    {formatDate(quiz.openAt)}
                                                </span>
                                                <span className="text-gray-500">
                                                    Closes:{" "}
                                                    {formatDate(quiz.closeAt)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="ml-6 flex space-x-2">
                                            {!quiz.published && (
                                                <button
                                                    onClick={() =>
                                                        handlePublishQuiz(
                                                            quiz._id
                                                        )
                                                    }
                                                    className="bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center text-sm"
                                                >
                                                    <Play className="h-3 w-3 mr-1" />
                                                    Publish
                                                </button>
                                            )}

                                            <Link
                                                to={`/quizzes/${quiz._id}/questions`}
                                                className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center text-sm"
                                            >
                                                <Eye className="h-3 w-3 mr-1" />
                                                Questions
                                            </Link>
                                            <button
                                                onClick={() =>
                                                    toggleGrades(quiz._id)
                                                }
                                                className="bg-purple-600 text-white px-3 py-2 rounded-md hover:bg-purple-700 transition-colors flex items-center text-sm"
                                            >
                                                <BarChart3 className="h-3 w-3 mr-1" />
                                                Grades
                                            </button>
                                        </div>
                                    </div>
                                    {expandedGrades[quiz._id] && (
                                        <div className="mt-4 border-t border-gray-200 pt-4">
                                            {(gradesByQuiz[quiz._id] || [])
                                                .length === 0 ? (
                                                <div className="text-sm text-gray-500">
                                                    No graded attempts yet.
                                                </div>
                                            ) : (
                                                <div className="overflow-x-auto">
                                                    <table className="min-w-full text-sm">
                                                        <thead>
                                                            <tr className="text-left text-gray-600">
                                                                <th className="py-2 pr-4">
                                                                    Student
                                                                </th>
                                                                <th className="py-2 pr-4">
                                                                    Email
                                                                </th>
                                                                <th className="py-2 pr-4">
                                                                    Score
                                                                </th>
                                                                <th className="py-2 pr-4">
                                                                    Submitted
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {gradesByQuiz[
                                                                quiz._id
                                                            ].map((g) => (
                                                                <tr
                                                                    key={
                                                                        g.attemptId
                                                                    }
                                                                    className="border-t border-gray-100"
                                                                >
                                                                    <td className="py-2 pr-4">
                                                                        {
                                                                            g
                                                                                .student
                                                                                ?.name
                                                                        }
                                                                    </td>
                                                                    <td className="py-2 pr-4">
                                                                        {
                                                                            g
                                                                                .student
                                                                                ?.email
                                                                        }
                                                                    </td>
                                                                    <td className="py-2 pr-4 font-medium text-gray-900">
                                                                        {
                                                                            g.score
                                                                        }
                                                                    </td>
                                                                    <td className="py-2 pr-4">
                                                                        {g.submittedAt
                                                                            ? formatDate(
                                                                                  g.submittedAt
                                                                              )
                                                                            : "-"}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuizManagement;
