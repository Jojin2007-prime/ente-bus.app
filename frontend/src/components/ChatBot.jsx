import React, { useState } from 'react';
import ChatBot from 'react-chatbotify';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

const EnteBusChatBot = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  // State to store the user's name to make it personal
  const [userName, setUserName] = useState("Traveler");

  // Chatbot logic
  const flow = {
    start: {
      message: "Hello! 👋 I am the EnteBus Assistant. May I know your name?",
      path: "save_name"
    },
    save_name: {
      message: (params) => {
        setUserName(params.userInput); // Save the name
        return `Nice to meet you, ${params.userInput}! 🌟 How can I help you today?`;
      },
      transition: { duration: 1000 }, // Wait 1 second (Simulates typing)
      options: ["Book a Ticket", "Check PNR Status", "Fare Estimator", "Bus Routes"],
      path: "process_options"
    },
    process_options: {
      transition: { duration: 0 },
      path: (params) => {
        const input = params.userInput.toLowerCase();
        
        if (input.includes("book") || input.includes("ticket")) return "book_ticket";
        if (input.includes("pnr") || input.includes("status")) return "check_pnr";
        if (input.includes("fare") || input.includes("price") || input.includes("cost")) return "fare_estimator";
        if (input.includes("route") || input.includes("schedule")) return "bus_routes";
        if (input.includes("support") || input.includes("help")) return "contact_support";
        if (input.includes("malayalam") || input.includes("swagatham")) return "malayalam_greet";
        
        return "unknown_input";
      }
    },
    
    // --- FEATURE 1: Smart PNR Checker ---
    check_pnr: {
      message: "Please enter your PNR Number (e.g., EB1023).",
      transition: { duration: 500 },
      path: (params) => {
        const pnr = params.userInput.toUpperCase();
        if (pnr.startsWith("EB")) return "pnr_found";
        return "pnr_not_found";
      }
    },
    pnr_found: {
        message: (params) => `✅ Found it, ${userName}!\n\nBus: Super Fast (KL-15-1234)\nStatus: CONFIRMED\nDeparts: 10:00 AM Today`,
        transition: { duration: 1000 },
        path: "anything_else"
    },
    pnr_not_found: {
        message: "❌ I couldn't find that PNR. Remember, valid PNRs start with 'EB'. Try again?",
        options: ["Yes, Try Again", "Main Menu"],
        path: (params) => {
            if (params.userInput === "Yes, Try Again") return "check_pnr";
            return "process_options";
        }
    },

    // --- FEATURE 2: Fare Estimator (With Math) ---
    fare_estimator: {
        message: "Select a route to get an estimate:",
        transition: { duration: 500 },
        options: ["Tvm - Kochi (₹280)", "Kochi - Kozhikode (₹210)", "Kannur - Kasaragod (₹110)"],
        path: (params) => {
            if (params.userInput.includes("280")) return "calc_280";
            if (params.userInput.includes("210")) return "calc_210";
            if (params.userInput.includes("110")) return "calc_110";
            return "unknown_input";
        }
    },
    calc_280: {
        message: "Got it. How many seats?",
        path: (params) => {
            const seats = parseInt(params.userInput);
            if (isNaN(seats)) return "invalid_number";
            const total = seats * 280;
            params.injectMessage(`💰 Total Estimate: ₹${total} (${seats} seats)`);
            return "anything_else";
        }
    },
    calc_210: {
        message: "Got it. How many seats?",
        path: (params) => {
            const seats = parseInt(params.userInput);
            if (isNaN(seats)) return "invalid_number";
            const total = seats * 210;
            params.injectMessage(`💰 Total Estimate: ₹${total} (${seats} seats)`);
            return "anything_else";
        }
    },
    calc_110: {
        message: "Got it. How many seats?",
        path: (params) => {
            const seats = parseInt(params.userInput);
            if (isNaN(seats)) return "invalid_number";
            const total = seats * 110;
            params.injectMessage(`💰 Total Estimate: ₹${total} (${seats} seats)`);
            return "anything_else";
        }
    },
    invalid_number: {
        message: "⚠️ Please type a number (e.g. 2).",
        path: "fare_estimator"
    },

    // --- Navigation Features ---
    book_ticket: {
      message: "I can take you to the booking page. Ready?",
      options: ["Let's Go!", "Wait, I have more questions"],
      path: (params) => {
        if (params.userInput === "Let's Go!") {
            navigate('/');
            return "redirect_message";
        }
        return "anything_else";
      }
    },
    bus_routes: {
        message: "Check out our full schedule here:",
        options: ["Open Schedule", "Go Back"],
        path: (params) => {
            if(params.userInput === "Open Schedule") {
                navigate('/schedule');
                return "redirect_message";
            }
            return "anything_else";
        }
    },
    
    // --- Utilities ---
    redirect_message: {
        message: "Navigating now... 🚀",
        transition: { duration: 1000 },
        path: "start_again_later"
    },
    anything_else: {
        message: `Is there anything else I can do for you, ${userName}?`,
        options: ["Main Menu", "No, I'm good"],
        path: (params) => {
            if (params.userInput === "No, I'm good") return "end_chat";
            return "process_options";
        }
    },
    end_chat: {
        message: "Thanks for chatting! Safe travels! 🚌✨",
        path: "start_again_later"
    },
    start_again_later: {
        message: "...", // Silent state waiting for new input
        path: "process_options"
    },
    unknown_input: {
      message: "I didn't quite catch that. Try selecting an option below:",
      options: ["Book Ticket", "Check PNR", "Fare Estimator"],
      path: "process_options"
    }
  };

  // --- PRO STYLING OPTIONS ---
  const botOptions = {
    theme: {
      primaryColor: '#4f46e5',
      secondaryColor: theme === 'dark' ? '#1f2937' : '#ffffff',
      fontFamily: 'Inter, system-ui, sans-serif',
      headerFontColor: '#ffffff',
      botBubbleColor: '#4f46e5',
      botFontColor: '#ffffff',
      userBubbleColor: theme === 'dark' ? '#374151' : '#f3f4f6',
      userFontColor: theme === 'dark' ? '#ffffff' : '#000000',
    },
    chatWindow: {
      backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
      showScrollbar: false
    },
    header: {
        title: 'EnteBus AI 🤖',
        avatar: 'https://cdn-icons-png.flaticon.com/512/4712/4712038.png',
        closeChatIcon: '⬇️'
    },
    footer: {
        text: 'Powered by EnteBus Logic'
    },
    audio: {
        disabled: false, // ✅ Sound Effects Enabled!
    },
    notification: {
        disabled: false,
        defaultToggledOn: true
    },
    tooltip: {
        mode: "START", 
        text: "Need help? Chat with me! 👋"
    }
  };

  return (
    <ChatBot 
      options={botOptions} 
      flow={flow} 
      key={theme} 
    />
  );
};

export default EnteBusChatBot;