package com.investclub.backend.web;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class ApiControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void setUp() {
        when(jdbcTemplate.queryForObject("SELECT 1", Integer.class)).thenReturn(1);
    }

    @Test
    void shouldReturnHealthStatus() throws Exception {
        mockMvc.perform(get("/api/health"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("UP"))
            .andExpect(jsonPath("$.database").value("UP"));
    }

    @Test
    void shouldReturnServiceUnavailableWhenDatabaseIsDown() throws Exception {
        when(jdbcTemplate.queryForObject("SELECT 1", Integer.class))
            .thenThrow(new DataAccessResourceFailureException("Database unavailable"));

        mockMvc.perform(get("/api/health"))
            .andExpect(status().isServiceUnavailable())
            .andExpect(jsonPath("$.status").value("DOWN"))
            .andExpect(jsonPath("$.database").value("DOWN"));
    }

    @Test
    void shouldReturnDemoPayload() throws Exception {
        mockMvc.perform(get("/api/demo"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.service").value("backend"))
            .andExpect(jsonPath("$.status").value("READY"))
            .andExpect(jsonPath("$.message").isNotEmpty());
    }
}
