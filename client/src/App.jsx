import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Signup from './pages/Signup';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import StudentScorecards from './pages/StudentScorecards';
import InterviewerDashboard from './pages/InterviewerDashboard';
import InterviewerProfileEdit from './pages/InterviewerProfileEdit';
import Interviewers from './pages/Interviewers';
import InterviewerProfile from './pages/InterviewerProfile';
import { ProtectedRoute } from './components/ProtectedRoute';
import { GuestRoute } from './components/GuestRoute';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route
        path="/signup"
        element={
          <GuestRoute>
            <Signup />
          </GuestRoute>
        }
      />
      <Route
        path="/login"
        element={
          <GuestRoute>
            <Login />
          </GuestRoute>
        }
      />

      <Route path="/interviewers" element={<Interviewers />} />
      <Route path="/interviewers/:id" element={<InterviewerProfile />} />

      <Route
        path="/student"
        element={
          <ProtectedRoute role="student">
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/scorecards"
        element={
          <ProtectedRoute role="student">
            <StudentScorecards />
          </ProtectedRoute>
        }
      />

      <Route
        path="/interviewer"
        element={
          <ProtectedRoute role="interviewer">
            <InterviewerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/interviewer/profile"
        element={
          <ProtectedRoute role="interviewer">
            <InterviewerProfileEdit />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
