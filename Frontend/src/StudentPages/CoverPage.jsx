import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Container, Typography, Box } from "@mui/material";
import bloodPressureImg from '../assets/blood_pressure_check.jpg';

const CoverPage = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate("/login");
  };

  const handleRegister = () => {
    navigate("/register");
  };

  return (
    <Box
      sx={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* Background Image */}
      <Box
        component="img"
        src={bloodPressureImg}
        alt="Blood Pressure Check"
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: 0,
        }}
      />

      {/* Overlay for better text readability */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0,0,0,0.5)",
          zIndex: 1,
        }}
      />

      {/* Content Container */}
      <Container
        maxWidth="sm"
        sx={{
          textAlign: "center",
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 2,
          color: "white",
        }}
      >
        <Typography
          variant="h3"
          gutterBottom
          sx={{
            fontSize: { xs: "1.8rem", sm: "2.5rem", md: "3rem" },
            fontWeight: "bold",
            textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
          }}
        >
          PARLIAMENT SAVINGS GROUP
        </Typography>

        <Typography
          variant="h6"
          gutterBottom
          sx={{
            fontSize: { xs: "0.9rem", sm: "1rem", md: "1.2rem" },
            mb: 3,
            textShadow: "1px 1px 3px rgba(0,0,0,0.5)",
          }}
        >
          Access Medication Anytime
        </Typography>

        <Button
          variant="contained"
          color="primary"
          onClick={handleLogin}
          size="large"
          sx={{
            mt: { xs: 2, sm: 3 },
            px: { xs: 3, sm: 4 },
            py: 1.5,
            fontSize: "1.1rem",
            mr: 2,
            boxShadow: "0 4px 6px rgba(0,0,0,0.2)",
            "&:hover": {
              boxShadow: "0 6px 8px rgba(0,0,0,0.3)",
            },
          }}
        >
          Login
        </Button>

        <Button
          variant="contained"
          color="secondary"
          onClick={handleRegister}
          size="large"
          sx={{
            mt: { xs: 2, sm: 3 },
            px: { xs: 3, sm: 4 },
            py: 1.5,
            fontSize: "1.1rem",
            boxShadow: "0 4px 6px rgba(0,0,0,0.2)",
            "&:hover": {
              boxShadow: "0 6px 8px rgba(0,0,0,0.3)",
            },
          }}
        >
          Register
        </Button>
      </Container>
    </Box>
  );
};

export default CoverPage;
