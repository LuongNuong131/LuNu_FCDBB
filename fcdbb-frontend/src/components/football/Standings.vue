<template>
  <div class="table-shell">
    <table class="data-table">
      <thead>
        <tr>
          <th>Đội</th>
          <th class="numeric">Trận</th>
          <th class="numeric">Thắng</th>
          <th class="numeric">Hòa</th>
          <th class="numeric">Thua</th>
          <th class="numeric">Hiệu số</th>
          <th class="numeric">Điểm</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="t in teams" :key="t.team">
          <td>
            <span class="flex items-center gap-2 font-semibold"
              ><span class="team-chip" :class="{ b: t.team === 'B' }">{{
                t.team
              }}</span
              >Đội {{ t.team }}</span
            >
          </td>
          <td class="numeric">{{ t.played }}</td>
          <td class="numeric">{{ t.won }}</td>
          <td class="numeric">{{ t.drawn }}</td>
          <td class="numeric">{{ t.lost }}</td>
          <td class="numeric">
            {{ t.goalsFor - t.goalsAgainst > 0 ? "+" : ""
            }}{{ t.goalsFor - t.goalsAgainst }}
          </td>
          <td class="numeric font-bold">{{ t.points }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
<script setup>
defineProps({ teams: { type: Array, default: () => [] } });
</script>
